import React from 'react';
import { Plus, Trash2, FileText, CheckCircle2, Volume2, Sparkles, RotateCw } from 'lucide-react';
import { Episode, AudioStatus } from '../types';

interface EpisodeListProps {
  episodes: Episode[];
  selectedEpisodeId: string | null;
  onSelectEpisode: (id: string) => void;
  onCreateEpisode: () => void;
  onDeleteEpisode: (id: string, e: React.MouseEvent) => void;
  onOpenAudioStudio: (episode: Episode, e: React.MouseEvent) => void;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  selectedEpisodeId,
  onSelectEpisode,
  onCreateEpisode,
  onDeleteEpisode,
  onOpenAudioStudio,
}) => {
  const getAudioBadge = (audioStatus?: AudioStatus) => {
    switch (audioStatus) {
      case 'generating':
        return (
          <span className="badge-pill badge-analyzed" style={{ fontSize: '0.6rem', padding: '0.15rem 0.45rem' }}>
            <RotateCw size={10} className="spin" /> Generating Audio
          </span>
        );
      case 'ready_to_review':
        return (
          <span className="badge-pill" style={{ fontSize: '0.6rem', padding: '0.15rem 0.45rem', borderColor: '#8B5CF6', color: '#A78BFA', background: 'rgba(139, 92, 246, 0.15)' }}>
            <Sparkles size={10} /> Ready to Review
          </span>
        );
      case 'published':
        return (
          <span className="badge-pill badge-finalized" style={{ fontSize: '0.6rem', padding: '0.15rem 0.45rem' }}>
            <CheckCircle2 size={10} /> Published Audio
          </span>
        );
      default:
        return (
          <span className="badge-pill badge-draft" style={{ fontSize: '0.6rem', padding: '0.15rem 0.45rem' }}>
            No Audio
          </span>
        );
    }
  };

  return (
    <aside className="panel" style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)', sticky: true, top: '90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText className="accent-text" size={18} />
          <h2 style={{ fontSize: '1rem' }}>Episodes</h2>
        </div>
        <button className="btn btn-primary" onClick={onCreateEpisode} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
          <Plus size={14} /> Add
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {episodes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
            No episodes yet. Click + Add to start writing.
          </div>
        ) : (
          episodes.map(episode => {
            const isSelected = episode.id === selectedEpisodeId;
            const isFinalized = episode.status === 'finalized';

            return (
              <div
                key={episode.id}
                onClick={() => onSelectEpisode(episode.id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--bg-panel-elevated)' : 'var(--bg-panel)',
                  border: isSelected ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 15px rgba(217, 30, 54, 0.2)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span className="eyebrow" style={{ fontSize: '0.65rem' }}>Ep {episode.episode_number}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {episode.status === 'draft' && <span className="badge-pill badge-draft">Draft</span>}
                    {episode.status === 'analyzed' && <span className="badge-pill badge-analyzed">Analyzed</span>}
                    {episode.status === 'finalized' && <span className="badge-pill badge-finalized">Finalized</span>}

                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.15rem 0.35rem', border: 'none' }}
                      onClick={(e) => onDeleteEpisode(episode.id, e)}
                      title="Delete Episode"
                    >
                      <Trash2 size={12} className="text-muted" />
                    </button>
                  </div>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-primary)', marginBottom: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {episode.title}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {getAudioBadge(episode.audio_status)}

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.65rem', gap: '0.3rem' }}
                    onClick={(e) => onOpenAudioStudio(episode, e)}
                  >
                    <Volume2 size={10} />
                    {episode.audio_status === 'none' || !episode.audio_status ? 'Convert Audio' : 'Audio Studio'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
