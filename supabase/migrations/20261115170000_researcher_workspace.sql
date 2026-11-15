-- Existing staged records remain unassigned and visible only to reviewers.
create table if not exists public.researcher_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('reviewer', 'admin'))
);
alter table public.researcher_roles enable row level security;

create table if not exists public.researcher_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('paper', 'brief', 'note', 'whiteboard')),
  title text not null check (char_length(title) between 1 and 300),
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists researcher_items_owner_idx on public.researcher_items(owner_id, updated_at desc);
alter table public.researcher_items enable row level security;
grant select, insert, update, delete on public.researcher_items to authenticated;
create policy "Researchers manage their own items" on public.researcher_items
  for all to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

alter table public.staged_candidates add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- Stop public direct writes. Privileged review is checked in server routes.
drop policy if exists "Public Read Staged Candidates" on public.staged_candidates;
drop policy if exists "Allow Write Staged Candidates" on public.staged_candidates;
drop policy if exists "Allow Write Corpus" on public.corpus_experiments;
drop policy if exists "Public Read Whiteboard" on public.whiteboard_sessions;
drop policy if exists "Allow Write Whiteboard" on public.whiteboard_sessions;

create or replace function public.delete_researcher_account()
returns void language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  delete from public.staged_candidates where owner_id = current_user_id;
  delete from auth.users where id = current_user_id;
end;
$$;
revoke all on function public.delete_researcher_account() from public;
grant execute on function public.delete_researcher_account() to authenticated;

-- Review and publication must either both commit or both roll back.
create or replace function public.review_research_submission(
  p_staged_id text, p_decision text, p_reviewer text, p_notes text, p_record jsonb
) returns void language plpgsql set search_path = '' as $$
begin
  if p_decision not in ('APPROVED_FOR_CORPUS', 'REJECTED_UNVERIFIED') then
    raise exception 'Invalid review decision';
  end if;
  update public.staged_candidates set review_status = p_decision, reviewer_name = p_reviewer,
    reviewer_notes = p_notes, review_decision_date = now() where staged_id = p_staged_id;
  if not found then raise exception 'Submission not found'; end if;
  if p_decision = 'APPROVED_FOR_CORPUS' then
    if p_record is null then raise exception 'Published record required'; end if;
    insert into public.corpus_experiments (id, programme, investigation, material, material_class,
      oxygen_pct, pressure_kpa, airflow_cm_s, gravity, platform, finding, fire_safety_relevance,
      source_url, doi, metadata)
    values (p_record->>'id', p_record->>'programme', p_record->>'investigation', p_record->>'material',
      p_record->>'material_class', (p_record->>'oxygen_pct')::numeric, (p_record->>'pressure_kpa')::numeric,
      (p_record->>'airflow_cm_s')::numeric, p_record->>'gravity', p_record->>'platform',
      p_record->>'finding', p_record->>'fire_safety_relevance', p_record->>'source_url', p_record->>'doi', p_record)
    on conflict (id) do update set programme = excluded.programme, investigation = excluded.investigation,
      material = excluded.material, material_class = excluded.material_class, oxygen_pct = excluded.oxygen_pct,
      pressure_kpa = excluded.pressure_kpa, airflow_cm_s = excluded.airflow_cm_s, gravity = excluded.gravity,
      platform = excluded.platform, finding = excluded.finding, fire_safety_relevance = excluded.fire_safety_relevance,
      source_url = excluded.source_url, doi = excluded.doi, metadata = excluded.metadata, promoted_at = now();
  end if;
end;
$$;
revoke all on function public.review_research_submission(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.review_research_submission(text, text, text, text, jsonb) to service_role;
