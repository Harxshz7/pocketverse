import { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw, AlertCircle } from 'lucide-react';
import GraphPanel from '../components/GraphPanel';
import LoadingState from '../components/LoadingState';
import { getStoryMemory } from '../services/api';

export default function StoryMemory() {
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStoryMemory();
      setMemory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemory();
  }, [fetchMemory]);

  const isEmpty = memory && (
    memory.characters.length === 0 &&
    memory.timeline_events.length === 0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-verse-red-dim">
            <Brain size={20} className="text-verse-red" />
          </div>
          <div>
            <h1 className="heading-lg text-verse-text">Story Memory Graph</h1>
            <p className="text-verse-text-muted text-sm mt-0.5">
              The system&apos;s structured understanding of your story
            </p>
          </div>
        </div>
        <button onClick={fetchMemory} className="btn-secondary text-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState type="skeleton" />
      ) : error ? (
        <div className="card p-8 text-center space-y-3 animate-fade-in">
          <AlertCircle size={32} className="text-verse-red mx-auto" />
          <p className="text-verse-text font-medium">Failed to load story memory</p>
          <p className="text-verse-text-muted text-sm">{error}</p>
          <button onClick={fetchMemory} className="btn-secondary text-sm mx-auto">
            Retry
          </button>
        </div>
      ) : isEmpty ? (
        <div className="card p-12 text-center space-y-3 animate-fade-in">
          <Brain size={40} className="text-verse-text-muted mx-auto opacity-40" />
          <p className="text-verse-text font-medium text-lg">No story data yet</p>
          <p className="text-verse-text-muted text-sm">
            Upload and ingest episodes to build the Story Memory Graph.
          </p>
        </div>
      ) : (
        <GraphPanel storyMemory={memory} />
      )}
    </div>
  );
}
