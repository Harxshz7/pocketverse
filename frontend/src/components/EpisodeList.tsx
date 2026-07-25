import React from 'react';
import { Plus, FileText, CheckCircle, AlertCircle, FileEdit, Trash2 } from 'lucide-react';
import { Episode, Series } from '../types';

interface EpisodeListProps {
  series: Series;
  episodes: Episode[];
  selectedEpisodeId: string | null;
  onSelectEpisode: (episode: Episode) => void;
  onCreateEpisode: () => void;
  onDeleteEpisode?: (episodeId: string) => void;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  series,
  episodes,
  selectedEpisodeId,
  onSelectEpisode,
  onCreateEpisode,
  onDeleteEpisode,
}) => {
  return (
    <aside style={{
      width: '300px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* Series Header Card */}
      <div className="panel panel-accent" style={{ padding: '1.25rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.35rem' }}>Active Series</div>
        <h2 style={{ fontSize: '1.1rem', wordBreak: 'break-word', margin: 0 }}>
          {series.title}
        </h2>
        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
          {episodes.length} {episodes.length === 1 ? 'Episode' : 'Episodes'} Total
        </div>

        <button
          className="btn btn-primary"
          onClick={onCreateEpisode}
          style={{ width: '100%', marginTop: '1rem', padding: '0.55rem' }}
        >
          <Plus size={16} />
          Add Episode
        </button>
      </div>

      {/* Episode Navigation Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
        <div className="eyebrow" style={{ padding: '0 0.25rem', color: 'var(--ink-muted)' }}>
          Series Timeline
        </div>

        {episodes.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--ink-muted)' }}>
            <FileText size={28} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.85rem' }}>No episodes yet.</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-dim)' }}>
              Click "Add Episode" to write your first chapter.
            </p>
          </div>
        ) : (
          episodes.map((ep) => {
            const isSelected = ep.id === selectedEpisodeId;
            return (
              <div
                key={ep.id}
                onClick={() => onSelectEpisode(ep)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-panel-elevated)' : 'var(--bg-panel)',
                  border: `1px solid ${isSelected ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
                  boxShadow: isSelected ? '0 0 15px rgba(217, 30, 54, 0.2)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: isSelected ? 'var(--accent-red)' : 'var(--ink-muted)',
                    letterSpacing: '0.08em',
                  }}>
                    EPISODE {ep.episode_number}
                  </span>

                  {/* 1px Pill Status Badges */}
                  <span className={`badge-pill badge-${ep.status}`}>
                    <span className="badge-dot" />
                    {ep.status}
                  </span>
                </div>

                <div style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: isSelected ? '#FFFFFF' : 'var(--ink-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {ep.title}
                </div>

                {onDeleteEpisode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete Episode ${ep.episode_number}: "${ep.title}"?`)) {
                        onDeleteEpisode(ep.id);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      bottom: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ink-dim)',
                      padding: '0.2rem',
                      opacity: 0.6,
                    }}
                    title="Delete Episode"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
