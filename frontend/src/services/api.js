/**
 * API service layer — handles all backend communication.
 * Falls back to mock data when backend is unavailable.
 */

import { mockEpisodes, mockStoryMemory, mockIssues } from '../data/mockData';

const BASE_URL = '/api/v1';

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    // If it's a network error (backend not running), throw with a flag
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const backendError = new Error('Backend unavailable');
      backendError.isNetworkError = true;
      throw backendError;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Episodes
// ---------------------------------------------------------------------------

export async function listEpisodes() {
  try {
    return await request('/episodes');
  } catch (err) {
    if (err.isNetworkError) {
      console.warn('[API] Backend offline — using mock episodes');
      return mockEpisodes.map(({ id, number, title, created_at }) => ({
        id, number, title, created_at,
      }));
    }
    throw err;
  }
}

export async function getEpisode(id) {
  try {
    return await request(`/episodes/${id}`);
  } catch (err) {
    if (err.isNetworkError) {
      return mockEpisodes.find(e => e.id === id) || null;
    }
    throw err;
  }
}

export async function ingestEpisode(data) {
  try {
    return await request('/episodes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    if (err.isNetworkError) {
      // Simulate ingestion with mock
      console.warn('[API] Backend offline — simulating ingestion');
      await new Promise(r => setTimeout(r, 2000)); // Fake delay
      return {
        id: Date.now(),
        number: data.number,
        title: data.title,
        raw_text: data.raw_text,
        created_at: new Date().toISOString(),
      };
    }
    throw err;
  }
}

export async function updateEpisode(id, data) {
  return await request(`/episodes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Story Memory Graph
// ---------------------------------------------------------------------------

export async function getStoryMemory() {
  try {
    const data = await request('/story-memory');
    // Fall back to mock if backend has no data yet (fresh DB)
    if (data && data.characters && data.characters.length === 0) {
      console.warn('[API] Backend has no data — using mock story memory');
      return mockStoryMemory;
    }
    return data;
  } catch (err) {
    if (err.isNetworkError) {
      console.warn('[API] Backend offline — using mock story memory');
      return mockStoryMemory;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export async function getIssues(episodeId) {
  try {
    return await request(`/episodes/${episodeId}/issues`);
  } catch (err) {
    if (err.isNetworkError) {
      console.warn('[API] Backend offline — using mock issues');
      return mockIssues.filter(i => i.episode_id === episodeId);
    }
    throw err;
  }
}

export async function getAllIssues() {
  try {
    const episodes = await listEpisodes();
    // If no real episodes, use mock data for demo
    if (!episodes || episodes.length === 0) {
      console.warn('[API] No episodes — using mock issues for demo');
      return mockIssues;
    }
    const allIssues = [];
    for (const ep of episodes) {
      const issues = await getIssues(ep.id);
      allIssues.push(...issues);
    }
    // If backend has episodes but no issues, still show mock for demo
    if (allIssues.length === 0) {
      console.warn('[API] No issues found — using mock issues for demo');
      return mockIssues;
    }
    return allIssues;
  } catch (err) {
    if (err.isNetworkError) {
      return mockIssues;
    }
    throw err;
  }
}

export async function validateEpisode(episodeId) {
  try {
    return await request(`/episodes/${episodeId}/validate`, { method: 'POST' });
  } catch (err) {
    if (err.isNetworkError) {
      console.warn('[API] Backend offline — using mock validation');
      await new Promise(r => setTimeout(r, 3000));
      return mockIssues.filter(i => i.episode_id === episodeId);
    }
    throw err;
  }
}

export async function revalidateEpisode(episodeId) {
  try {
    return await request(`/episodes/${episodeId}/revalidate`, { method: 'POST' });
  } catch (err) {
    if (err.isNetworkError) {
      console.warn('[API] Backend offline — simulating revalidation');
      await new Promise(r => setTimeout(r, 2000));
      // Simulate: some issues resolved
      return mockIssues
        .filter(i => i.episode_id === episodeId)
        .map(i => ({ ...i, resolved: true, resolved_evidence: 'Issue addressed in updated text.' }));
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Usage stats
// ---------------------------------------------------------------------------

export async function getUsage() {
  return await request('/usage');
}
