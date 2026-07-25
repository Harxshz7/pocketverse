import { PerformanceBrief } from '../types';

const API_BASE = '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `API Request Failed (${response.status})`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error) message = parsed.error;
    } catch (e) {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Series
  getAllSeries: () => fetchJson<any[]>('/series'),
  getSeriesById: (id: string) => fetchJson<any>(`/series/${id}`),
  createSeries: (data: { title: string; description?: string }) =>
    fetchJson<any>('/series', { method: 'POST', body: JSON.stringify(data) }),

  // Episodes
  createEpisode: (seriesId: string, data: { title: string; content?: string }) =>
    fetchJson<any>(`/series/${seriesId}/episodes`, { method: 'POST', body: JSON.stringify(data) }),
  getEpisodeById: (id: string) => fetchJson<any>(`/episodes/${id}`),
  updateEpisode: (id: string, data: { title?: string; content?: string; status?: string }) =>
    fetchJson<any>(`/episodes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEpisode: (id: string) => fetchJson<any>(`/episodes/${id}`, { method: 'DELETE' }),

  // Wizard Analysis Pipeline
  runContinuity: (episodeId: string) =>
    fetchJson<any>(`/episodes/${episodeId}/analysis/continuity`, { method: 'POST' }),
  runGrammar: (episodeId: string) =>
    fetchJson<any>(`/episodes/${episodeId}/analysis/grammar`, { method: 'POST' }),
  runToneRemix: (episodeId: string, category: string) =>
    fetchJson<any>(`/episodes/${episodeId}/analysis/tone`, {
      method: 'POST',
      body: JSON.stringify({ category }),
    }),
  saveAndPublishText: (episodeId: string, finalContent?: string) =>
    fetchJson<any>(`/episodes/${episodeId}/analysis/save`, {
      method: 'POST',
      body: JSON.stringify({ finalContent }),
    }),

  // Audio Production Pipeline
  getAudioDirection: (episodeId: string) =>
    fetchJson<{ episode_id: string; tone_category: string; performance_brief: PerformanceBrief }>(
      `/episodes/${episodeId}/audio/direction`,
      { method: 'POST' }
    ),
  generateAudio: (episodeId: string, performance_brief?: PerformanceBrief) =>
    fetchJson<{ message: string; audio_status: string; render: any }>(
      `/episodes/${episodeId}/audio/generate`,
      {
        method: 'POST',
        body: JSON.stringify({ performance_brief }),
      }
    ),
  getAudioStatus: (episodeId: string) =>
    fetchJson<{ episode_id: string; audio_status: string; published_at: string | null; latest_render: any }>(
      `/episodes/${episodeId}/audio`
    ),
  publishAudio: (episodeId: string) =>
    fetchJson<{ message: string; episode_id: string; audio_status: string; published_at: string }>(
      `/episodes/${episodeId}/audio/publish`,
      { method: 'POST' }
    ),
};
