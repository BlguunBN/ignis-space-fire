-- ==============================================================================
-- IGNIS Space Fire Evidence Intelligence Dashboard
-- Supabase Database Schema
-- Run this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create Staged Candidates Table (Stage 4 Ingestion Pipeline)
CREATE TABLE IF NOT EXISTS public.staged_candidates (
  staged_id TEXT PRIMARY KEY,
  document_title TEXT NOT NULL,
  filename TEXT NOT NULL,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  candidate_programme TEXT NOT NULL,
  candidate_platform TEXT NOT NULL,
  candidate_material TEXT NOT NULL,
  candidate_oxygen_pct NUMERIC NOT NULL,
  candidate_airflow_cm_s NUMERIC NOT NULL,
  candidate_pressure_kpa NUMERIC NOT NULL,
  extracted_finding TEXT NOT NULL,
  extracted_quote TEXT NOT NULL,
  page_number INT DEFAULT 1,
  source_locator TEXT NOT NULL,
  doi TEXT,
  review_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'APPROVED_FOR_CORPUS', 'REJECTED_UNVERIFIED'
  reviewer_name TEXT,
  review_decision_date TIMESTAMPTZ,
  reviewer_notes TEXT,
  extracted_bounding_boxes JSONB,
  extracted_tables JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Active Flight Corpus Table (Promoted Evidence Records)
CREATE TABLE IF NOT EXISTS public.corpus_experiments (
  id TEXT PRIMARY KEY,
  programme TEXT NOT NULL,
  investigation TEXT NOT NULL,
  material TEXT NOT NULL,
  material_class TEXT DEFAULT 'spacecraft_materials',
  oxygen_pct NUMERIC,
  pressure_kpa NUMERIC,
  airflow_cm_s NUMERIC,
  gravity TEXT DEFAULT 'microgravity',
  platform TEXT NOT NULL,
  finding TEXT NOT NULL,
  fire_safety_relevance TEXT,
  source_url TEXT NOT NULL,
  doi TEXT,
  metadata JSONB,
  promoted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Whiteboard Studio Sessions Table
CREATE TABLE IF NOT EXISTS public.whiteboard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  tree_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes for High-Speed Research Queries
CREATE INDEX IF NOT EXISTS idx_staged_status ON public.staged_candidates (review_status);
CREATE INDEX IF NOT EXISTS idx_staged_date ON public.staged_candidates (extracted_at DESC);
CREATE INDEX IF NOT EXISTS idx_corpus_material ON public.corpus_experiments (material);
CREATE INDEX IF NOT EXISTS idx_corpus_gravity ON public.corpus_experiments (gravity);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.staged_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corpus_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_sessions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Allow public read & authenticated/anon writes for IGNIS mission dashboard
DROP POLICY IF EXISTS "Public Read Staged Candidates" ON public.staged_candidates;
CREATE POLICY "Public Read Staged Candidates" ON public.staged_candidates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Write Staged Candidates" ON public.staged_candidates;
CREATE POLICY "Allow Write Staged Candidates" ON public.staged_candidates
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Corpus" ON public.corpus_experiments;
CREATE POLICY "Public Read Corpus" ON public.corpus_experiments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Write Corpus" ON public.corpus_experiments;
CREATE POLICY "Allow Write Corpus" ON public.corpus_experiments
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Whiteboard" ON public.whiteboard_sessions;
CREATE POLICY "Public Read Whiteboard" ON public.whiteboard_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Write Whiteboard" ON public.whiteboard_sessions;
CREATE POLICY "Allow Write Whiteboard" ON public.whiteboard_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Seed Initial Baseline Saffire & SoFIE Candidates
INSERT INTO public.staged_candidates (
  staged_id, document_title, filename, candidate_programme, candidate_platform,
  candidate_material, candidate_oxygen_pct, candidate_airflow_cm_s, candidate_pressure_kpa,
  extracted_finding, extracted_quote, page_number, source_locator, doi, review_status
) VALUES
(
  'staged-saffire-5-extinction',
  'Saffire-V Low-Pressure Concurrent Flame Extinction in Cotton-Fiberglass Blends',
  'NASA-TM-2022-0019284.pdf',
  'Saffire',
  'Cygnus Cargo Vehicle (OA-14)',
  'cotton-fiberglass (SIBAL)',
  24.0, 12.0, 70.3,
  'Concurrent flame spread decelerates abruptly as cabin depressurization reaches 70 kPa under 12 cm/s airflow, demonstrating non-linear pressure quenching.',
  'Flame length decreased by 40% when chamber pressure dropped below 75 kPa, indicating elevated limiting oxygen index.',
  12,
  'NASA Glenn Research Center / Saffire-V Table 3',
  '10.60555/0t15-s5ex',
  'PENDING_REVIEW'
),
(
  'staged-sofie-gel-pmma',
  'SoFIE GEL: Solid Fuel Ignition and Extinction in Low-Speed Cabin Flows',
  'NASA-TM-2024-SoFIE-GEL.pdf',
  'SoFIE',
  'ISS Combustion Integrated Rack (CIR)',
  'thick PMMA cylinder (30mm)',
  34.0, 4.5, 101.3,
  'Extinction limit for 30mm thick cylindrical PMMA requires minimum 34% O2 in sub-5 cm/s flow regimes due to internal conductive quenching.',
  'Thick samples undergo radiative and conductive heat loss exceeding chemical heat release below 34% oxygen concentration.',
  15,
  'NASA Glenn Research Center / SoFIE PSI Archive Table 4',
  '10.60555/0t15-sofie-gel',
  'PENDING_REVIEW'
)
ON CONFLICT (staged_id) DO NOTHING;
