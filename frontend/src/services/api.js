/**
 * API service layer for real backend data only.
 * No demo/mock fallback: if the backend is unavailable, the UI shows the error.
 */

const BASE_URL = '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return await res.json();
}

export async function listEpisodes() {
  return await request('/episodes');
}

export async function getEpisode(id) {
  return await request(`/episodes/${id}`);
}

export async function ingestEpisode(data) {
  return await request('/episodes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEpisode(id, data) {
  return await request(`/episodes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getStoryMemory() {
  return await request('/story-memory');
}

export async function getIssues(episodeId) {
  return await request(`/episodes/${episodeId}/issues`);
}

export async function getAllIssues() {
  const episodes = await listEpisodes();
  const allIssues = [];
  for (const episode of episodes) {
    const issues = await getIssues(episode.id);
    allIssues.push(...issues);
  }
  return allIssues;
}

export async function validateEpisode(episodeId) {
  return await request(`/episodes/${episodeId}/validate`, { method: 'POST' });
}

export async function revalidateEpisode(episodeId) {
  return await request(`/episodes/${episodeId}/revalidate`, { method: 'POST' });
}

export async function recordPatchDecision(issueId, action, variantId = null) {
  return await request(`/issues/${issueId}/patch`, {
    method: 'POST',
    body: JSON.stringify({ action, variant_id: variantId }),
  });
}

export async function generateFinalVersion(episodeId) {
  return await request(`/episodes/${episodeId}/final-version`, {
    method: 'POST',
  });
}

export async function getUsage() {
  return await request('/usage');
}
