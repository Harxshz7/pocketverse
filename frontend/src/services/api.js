/**
 * API service layer for real backend data only.
 * No demo/mock fallback: if the backend is unavailable, the UI shows the error.
 */

const BASE_URL = '/api/v1';
const REQUEST_TIMEOUT_MS = 45000;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check that the backend is running and responsive.');
    }
    throw new Error('Backend is not reachable. Start the app with ./start.sh and try again.');
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    const message = error.detail || error.error?.message || error.message || `HTTP ${res.status}`;
    throw new Error(message);
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
