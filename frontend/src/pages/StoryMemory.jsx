import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Brain, Clock, GitBranch, RefreshCw, Users } from 'lucide-react';
import GraphPanel from '../components/GraphPanel';
import LoadingState from '../components/LoadingState';
import CinematicScene from '../components/CinematicScene';
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

  const stats = [
    { label: 'Characters', value: memory?.characters?.length || 0, icon: Users },
    { label: 'Relationships', value: memory?.relationships?.length || 0, icon: GitBranch },
    { label: 'Timeline', value: memory?.timeline_events?.length || 0, icon: Clock },
    { label: 'Rules', value: memory?.world_rules?.length || 0, icon: Brain },
  ];

  return (
    <div className="page-shell space-y-6">
      <section className="page-spotlight">
        <div className="relative z-10 space-y-5">
          <div className="hero-kicker mono">
            <Brain size={14} className="text-verse-red" />
            <strong>Story Memory Graph</strong>
            <span>Canon made queryable</span>
          </div>
          <div className="space-y-3">
            <h1 className="page-title">Your story, as structured memory.</h1>
            <p className="page-subtitle">
              Inspect the extracted canon the validation engine uses: character traits,
              relationship states, timeline order, world rules, promises, and secrets.
            </p>
          </div>
          <button onClick={fetchMemory} className="btn-secondary text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Graph
          </button>
        </div>
        <CinematicScene variant="memory" compact />
      </section>

      <section className="stat-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between gap-3">
              <p>{label}</p>
              <Icon size={16} className="text-verse-red" />
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      {loading ? (
        <LoadingState type="skeleton" />
      ) : error ? (
        <div className="glass-panel p-8 text-center space-y-3 animate-fade-in">
          <AlertCircle size={32} className="text-verse-red mx-auto" />
          <p className="text-verse-text font-medium">Failed to load story memory</p>
          <p className="text-verse-text-muted text-sm">{error}</p>
          <button onClick={fetchMemory} className="btn-secondary text-sm mx-auto">
            Retry
          </button>
        </div>
      ) : isEmpty ? (
        <div className="glass-panel p-12 text-center space-y-3 animate-fade-in">
          <Brain size={44} className="text-verse-text-muted mx-auto opacity-40" />
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
