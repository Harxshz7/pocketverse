export interface Series {
  id: string;
  title: string;
  creator_id: string;
  created_at: string;
  episodes?: Episode[];
}

export type EpisodeStatus = 'draft' | 'analyzed' | 'finalized';

export interface Episode {
  id: string;
  series_id: string;
  episode_number: number;
  title: string;
  content: string;
  status: EpisodeStatus;
  created_at: string;
  updated_at: string;
}

export interface ContinuityIssue {
  id: string;
  severity: 'critical' | 'moderate' | 'minor';
  title: string;
  snippet: string;
  description: string;
  suggestion: string;
  accepted: boolean;
}

export interface HookCheck {
  score: number; // 1 to 10
  status: 'strong' | 'moderate' | 'flat';
  review: string;
  suggestion: string;
  accepted?: boolean;
}

export interface ContinuityResult {
  issues: ContinuityIssue[];
  matched_against_episode_id: string | null;
  matched_against_episode_title?: string | null;
  hook_check: HookCheck;
}

export interface GrammarIssue {
  id: string;
  snippet: string;
  issue: string;
  suggested_fix: string;
  accepted: boolean;
}

export interface ToneRemixResult {
  category: string;
  original_content: string;
  remixed_content: string;
  summary: string;
  accepted: boolean;
}

export type AnalysisStatus = 'pending' | 'continuity_done' | 'grammar_done' | 'tone_step' | 'complete';

export interface AnalysisRun {
  id: string;
  episode_id: string;
  continuity_result?: ContinuityResult | null;
  grammar_result?: GrammarIssue[] | null;
  tone_remix_result?: ToneRemixResult | null;
  status: AnalysisStatus;
  created_at: string;
  updated_at: string;
}
