import { Series, Episode, ContinuityResult, GrammarIssue, ToneRemixResult } from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export async function fetchSeriesList(): Promise<Series[]> {
  const res = await fetch(`${API_BASE}/series`);
  return handleResponse<Series[]>(res);
}

export async function createSeries(title: string): Promise<Series> {
  const res = await fetch(`${API_BASE}/series`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return handleResponse<Series>(res);
}

export async function fetchSeriesById(id: string): Promise<Series> {
  const res = await fetch(`${API_BASE}/series/${id}`);
  return handleResponse<Series>(res);
}

export async function createEpisode(seriesId: string, title: string, content: string): Promise<Episode> {
  const res = await fetch(`${API_BASE}/series/${seriesId}/episodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  return handleResponse<Episode>(res);
}

export async function fetchEpisodeById(id: string): Promise<Episode & { series_title: string; analysis_run?: any }> {
  const res = await fetch(`${API_BASE}/episodes/${id}`);
  return handleResponse<any>(res);
}

export async function updateEpisode(id: string, title: string, content: string): Promise<Episode> {
  const res = await fetch(`${API_BASE}/episodes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  return handleResponse<Episode>(res);
}

export async function deleteEpisode(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/episodes/${id}`, { method: 'DELETE' });
  await handleResponse<{ message: string }>(res);
}

// Wizard API Calls
export async function runContinuityAnalysis(episodeId: string): Promise<{ analysis_run_id: string; continuity_result: ContinuityResult }> {
  const res = await fetch(`${API_BASE}/episodes/${episodeId}/analysis/continuity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<any>(res);
}

export async function runGrammarAnalysis(episodeId: string, currentContent?: string): Promise<{ analysis_run_id: string; grammar_result: GrammarIssue[] }> {
  const res = await fetch(`${API_BASE}/episodes/${episodeId}/analysis/grammar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_content: currentContent }),
  });
  return handleResponse<any>(res);
}

export async function runToneRemix(episodeId: string, category: string, currentContent?: string): Promise<{ analysis_run_id: string; tone_remix_result: ToneRemixResult }> {
  const res = await fetch(`${API_BASE}/episodes/${episodeId}/analysis/tone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, current_content: currentContent }),
  });
  return handleResponse<any>(res);
}

export async function saveAnalysis(episodeId: string, finalContent: string): Promise<{ message: string; episode: Episode }> {
  const res = await fetch(`${API_BASE}/episodes/${episodeId}/analysis/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ final_content: finalContent }),
  });
  return handleResponse<any>(res);
}
