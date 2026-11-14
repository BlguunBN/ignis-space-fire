export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  ntrs_id?: string;
  url: string;
  programme: string;
  summary: string;
  relevance: string;
  verified_source: string;
}
