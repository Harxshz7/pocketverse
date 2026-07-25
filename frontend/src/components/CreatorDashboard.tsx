import React, { useState } from 'react';
import { Series, Episode } from '../types';
import { Plus, Play, Volume2, Edit3, Trash2, RotateCw, FileText, Sparkles, CheckCircle2, ShieldCheck, Clock, Layers, UserCheck } from 'lucide-react';
import { api } from '../api/client';

interface CreatorDashboardProps {
  series: Series | null;
  seriesList: Series[];
  selectedEpisodeId: string | null;
  onSelectSeries: (series: Series) => void;
  onSelectEpisode: (episodeId: string) => void;
  onCreateEpisode: () => void;
  onOpenNewSeriesModal: () => void;
  onDeleteEpisode: (episodeId: string, e: React.MouseEvent) => void;
  onOpenAudioStudio: (episode: Episode, e?: React.MouseEvent) => void;
  onOpenWizard: (episode: Episode) => void;
  onRefreshSeries: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  series,
  seriesList,
  selectedEpisodeId,
  onSelectSeries,
  onSelectEpisode,
  onCreateEpisode,
  onOpenNewSeriesModal,
  onDeleteEpisode,
  onOpenAudioStudio,
  onOpenWizard,
  onRefreshSeries,
}) => {
  // Script Editing Modal State
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [savingScript, setSavingScript] = useState<boolean>(false);
  const [autoRegenAudio, setAutoRegenAudio] = useState<boolean>(true);

  if (!series) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-panel)' }}>
        <Layers size={48} color="var(--accent-red)" style={{ marginBottom: '1rem' }} />
        <h2>Welcome to Your Creator Command Center</h2>
        <p className="text-muted" style={{ margin: '1rem 0 1.5rem 0', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
          Create your first story series to unlock multi-episode AI continuity reviews, male voice narration, and studio soundscapes.
        </p>
        <button className="btn btn-primary" onClick={onOpenNewSeriesModal} style={{ padding: '0.75rem 1.75rem' }}>
          <Plus size={18} /> Create New Series
        </button>
      </div>
    );
  }

  const episodes = series.episodes || [];

  // Calculate Creator Analytics
  const totalEpisodes = episodes.length;
  const totalWords = episodes.reduce((sum, ep) => sum + (ep.content ? ep.content.trim().split(/\s+/).filter(Boolean).length : 0), 0);
  const totalChars = episodes.reduce((sum, ep) => sum + (ep.content ? ep.content.length : 0), 0);
  const episodesWithAudio = episodes.filter(ep => ep.audio_status === 'ready_to_review' || ep.audio_status === 'published').length;
  const totalAudioMinutes = Math.round(episodes.reduce((sum, ep) => sum + (ep.content ? ep.content.trim().split(/\s+/).filter(Boolean).length / 130 : 0), 0));

  const handleOpenEditModal = (ep: Episode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEpisode(ep);
    setEditTitle(ep.title);
    setEditContent(ep.content || '');
    setAutoRegenAudio(ep.audio_status === 'ready_to_review' || ep.audio_status === 'published');
  };

  const handleSaveScriptChanges = async () => {
    if (!editingEpisode) return;
    setSavingScript(true);
    try {
      await api.updateEpisode(editingEpisode.id, { title: editTitle, content: editContent });
      
      // If user selected auto-regenerate improvised voice, open audio studio directly
      if (autoRegenAudio) {
        const updatedEp = { ...editingEpisode, title: editTitle, content: editContent };
        setEditingEpisode(null);
        onRefreshSeries();
        onOpenAudioStudio(updatedEp);
      } else {
        setEditingEpisode(null);
        onRefreshSeries();
      }
    } catch (err: any) {
      console.error('Failed to save script edits:', err);
      alert(err.message || 'Failed to save script changes');
    } finally {
      setSavingScript(false);
    }
  };

  const handleReGenerateAudio = (ep: Episode, e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenAudioStudio(ep, e);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
      {/* Top Banner & Quick Action Header */}
      <div className="panel panel-accent" style={{
        padding: '1.5rem 1.75rem',
        background: 'var(--bg-void)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span className="badge-pill badge-analyzed" style={{ fontSize: '0.7rem' }}>
              Series Creator Workspace
            </span>
            <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>
              {(series as any).genre_tag || 'Drama'} Tone
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800 }}>
            {series.title}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.35rem', maxWidth: '600px' }}>
            {(series as any).description || 'Serialized fiction & AI audio drama production workspace.'}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            className="btn btn-outline"
            onClick={onOpenNewSeriesModal}
            style={{ padding: '0.65rem 1.15rem' }}
          >
            <Plus size={16} /> New Series
          </button>

          <button
            className="btn btn-primary"
            onClick={onCreateEpisode}
            style={{ padding: '0.7rem 1.5rem', background: 'var(--accent-red)', borderColor: 'var(--accent-red)', boxShadow: 'var(--shadow-glow)' }}
          >
            <Plus size={18} /> Add New Episode
          </button>
        </div>
      </div>

      {/* 4 Analytics Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        <div className="panel" style={{ padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(217, 30, 54, 0.15)', border: '1px solid var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={20} color="var(--accent-red)" />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)' }}>{totalEpisodes}</div>
            <div className="eyebrow" style={{ fontSize: '0.65rem' }}>Total Episodes Created</div>
          </div>
        </div>

        <div className="panel" style={{ padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="#8B5CF6" />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)' }}>{totalWords.toLocaleString()}</div>
            <div className="eyebrow" style={{ fontSize: '0.65rem' }}>Manuscript Words Written</div>
          </div>
        </div>

        <div className="panel" style={{ padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={20} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)' }}>{episodesWithAudio} / {totalEpisodes}</div>
            <div className="eyebrow" style={{ fontSize: '0.65rem' }}>Male Voice Narration Ready</div>
          </div>
        </div>

        <div className="panel" style={{ padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="#3B82F6" />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)' }}>~{totalAudioMinutes}m</div>
            <div className="eyebrow" style={{ fontSize: '0.65rem' }}>Estimated Audio Runtime</div>
          </div>
        </div>
      </div>

      {/* Episode Directory Table & Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            EPISODE DIRECTORY & AUDIO PRODUCTION STAGE
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
            Click any episode card to review AI continuity, edit text, or generate OpenAI male audio tracks.
          </span>
        </div>

        {episodes.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-panel)' }}>
            <FileText size={36} color="var(--ink-dim)" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ margin: 0 }}>No Episodes Created Yet in "{series.title}"</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.35rem', marginBottom: '1.25rem' }}>
              Click "Add New Episode" above to start writing Episode 1.
            </p>
            <button className="btn btn-primary" onClick={onCreateEpisode}>
              <Plus size={16} /> Add Episode 1 Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {episodes.map((ep) => {
              const isSelected = selectedEpisodeId === ep.id;
              const wordCount = ep.content ? ep.content.trim().split(/\s+/).filter(Boolean).length : 0;
              const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 130));
              const hasAudio = ep.audio_status === 'ready_to_review' || ep.audio_status === 'published';

              return (
                <div
                  key={ep.id}
                  className="panel"
                  onClick={() => onSelectEpisode(ep.id)}
                  style={{
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-red)' : 'var(--border-subtle)',
                    background: isSelected ? 'rgba(217, 30, 54, 0.06)' : 'var(--bg-panel)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Episode Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-sm)',
                      background: hasAudio ? 'rgba(16, 185, 129, 0.15)' : 'rgba(217, 30, 54, 0.12)',
                      border: `1px solid ${hasAudio ? '#10B981' : 'var(--accent-red-dim)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: hasAudio ? '#10B981' : 'var(--accent-red)',
                    }}>
                      <span style={{ fontSize: '0.55rem', opacity: 0.8, textTransform: 'uppercase' }}>EP</span>
                      {ep.episode_number}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink-primary)' }}>
                          {ep.title}
                        </span>

                        {ep.audio_status === 'published' ? (
                          <span className="badge-pill badge-finalized" style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>
                            <ShieldCheck size={11} /> Published Live
                          </span>
                        ) : ep.audio_status === 'ready_to_review' ? (
                          <span className="badge-pill" style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem', borderColor: '#8B5CF6', color: '#A78BFA', background: 'rgba(139, 92, 246, 0.15)' }}>
                            <Sparkles size={11} /> Ready to Review
                          </span>
                        ) : (
                          <span className="badge-pill badge-draft" style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>
                            Draft Text
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span><FileText size={12} style={{ display: 'inline', marginRight: '3px' }} /> {wordCount} Words ({ep.content?.length || 0} Chars)</span>
                        <span>&bull;</span>
                        <span><Clock size={12} style={{ display: 'inline', marginRight: '3px' }} /> ~{estimatedMinutes} min listen</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Menu Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {/* Primary Voice Action Button */}
                    {hasAudio ? (
                      <button
                        className="btn btn-primary"
                        onClick={(e) => onOpenAudioStudio(ep, e)}
                        style={{ padding: '0.5rem 1.15rem', fontSize: '0.8rem', background: '#10B981', borderColor: '#10B981' }}
                      >
                        <Play size={14} style={{ fill: '#FFF' }} /> Play Episode Audio
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={(e) => onOpenAudioStudio(ep, e)}
                        style={{ padding: '0.5rem 1.15rem', fontSize: '0.8rem' }}
                      >
                        <Volume2 size={14} /> Generate Directed Audio
                      </button>
                    )}

                    {/* 3 Hover Quick Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      {/* 1. Edit Script Text */}
                      <button
                        className="btn-outline"
                        title="Edit Manuscript Text"
                        onClick={(e) => handleOpenEditModal(ep, e)}
                        style={{ border: 'none', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Edit3 size={15} color="var(--ink-primary)" />
                      </button>

                      {/* 2. Improvised Voice Re-Gen */}
                      <button
                        className="btn-outline"
                        title="Re-Generate Improvised Voice Track"
                        onClick={(e) => handleReGenerateAudio(ep, e)}
                        style={{ border: 'none', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <RotateCw size={15} color="var(--accent-red)" />
                      </button>

                      {/* 3. Delete Episode */}
                      <button
                        className="btn-outline"
                        title="Delete Episode"
                        onClick={(e) => onDeleteEpisode(ep.id, e)}
                        style={{ border: 'none', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Trash2 size={15} color="#EF4444" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manuscript Text Edit Modal */}
      {editingEpisode && (
        <div className="modal-overlay" style={{ zIndex: 220 }} onClick={() => setEditingEpisode(null)}>
          <div className="modal-card" style={{ maxWidth: '780px', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Edit3 size={20} color="var(--accent-red)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Episode Script: Episode {editingEpisode.episode_number}</h3>
              </div>
              <button className="btn-outline" onClick={() => setEditingEpisode(null)} style={{ border: 'none', padding: '0.35rem' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>Episode Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Episode Title..."
                />
              </div>

              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>Manuscript Text Content</label>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Type manuscript text..."
                  style={{ minHeight: '260px', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', lineHeight: 1.6 }}
                />
              </div>

              <div style={{
                padding: '0.85rem 1rem',
                background: 'rgba(217, 30, 54, 0.08)',
                border: '1px solid var(--accent-red-dim)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
              }} onClick={() => setAutoRegenAudio(!autoRegenAudio)}>
                <input
                  type="checkbox"
                  checked={autoRegenAudio}
                  onChange={e => setAutoRegenAudio(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                  🚀 Open Audio Studio to generate Improvised Male Voice Track for updated script after saving
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setEditingEpisode(null)} disabled={savingScript}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveScriptChanges} disabled={savingScript}>
                {savingScript ? 'Saving Script...' : 'Save Script & Re-Generate Improvised Voice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
