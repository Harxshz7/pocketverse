/**
 * API service layer — handles all backend communication.
 * Falls back to mock data when backend is unavailable.
 */

import { mockEpisodes, mockStoryMemory, mockIssues } from '../data/mockData';

const BASE_URL = '/api/v1';

function isNotFoundError(err) {
  return err.message === 'Not Found'
    || err.message === 'Issue not found'
    || err.message === 'Rewrite variant not found';
}

function buildMockPatchDecision(issueId, action, variantId = null) {
  const issue = mockIssues.find(i => i.id === issueId);
  const variant = issue?.rewrite_variants?.find(v => v.variant_id === variantId);
  return {
    id: Date.now(),
    episode_id: issue?.episode_id,
    issue_id: issueId,
    action,
    variant_db_id: variant?.id || null,
    original_span: variant?.original_span || null,
    rewritten_text: variant?.rewritten_text || null,
  };
}

function applyMockAcceptedPatches(originalText, episodeIssues) {
  let finalText = originalText;
  const accepted = episodeIssues
    .map(issue => issue.patch_decision)
    .filter(decision =>
      decision?.action === 'accept_variant'
      && decision.original_span
      && decision.rewritten_text
    );

  for (const decision of accepted) {
    finalText = finalText.replace(decision.original_span, decision.rewritten_text);
  }
  return finalText;
}

function buildMockFinalVersion(episodeId, currentIssues = mockIssues) {
  const currentEpisodeIssues = currentIssues.filter(i => i.episode_id === episodeId);
  const episode = mockEpisodes.find(e => e.id === episodeId);
  const originalText = episode?.raw_text || '';
  const finalText = applyMockAcceptedPatches(originalText, currentEpisodeIssues);

  return {
    version: {
      id: Date.now(),
      episode_id: episodeId,
      version_number: 1,
      raw_text: finalText,
      source: 'accepted_patches',
      validation_status: 'passed',
      created_at: new Date().toISOString(),
    },
    original_text: originalText,
    final_text: finalText,
    issues: currentEpisodeIssues.map(i => ({
      ...i,
      resolved: true,
      resolved_evidence: 'Final version generated from accepted patches.',
    })),
    resolved_count: currentEpisodeIssues.length,
    remaining_count: 0,
  };
}

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

export async function recordPatchDecision(issueId, action, variantId = null) {
  try {
    return await request(`/issues/${issueId}/patch`, {
      method: 'POST',
      body: JSON.stringify({ action, variant_id: variantId }),
    });
  } catch (err) {
    const isMockIssue = mockIssues.some(i => i.id === issueId);
    if (err.isNetworkError || (isMockIssue && isNotFoundError(err))) {
      console.warn('[API] Using mock patch decision');
      return buildMockPatchDecision(issueId, action, variantId);
    }
    throw err;
  }
}

export async function generateFinalVersion(episodeId, currentIssues = null) {
  try {
    return await request(`/episodes/${episodeId}/final-version`, {
      method: 'POST',
    });
  } catch (err) {
    const hasMockIssues = mockIssues.some(i => i.episode_id === episodeId);
    if (err.isNetworkError || (hasMockIssues && isNotFoundError(err))) {
      console.warn('[API] Using mock final version generation');
      await new Promise(r => setTimeout(r, 1500));
      return buildMockFinalVersion(episodeId, currentIssues || mockIssues);
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
