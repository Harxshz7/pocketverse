import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Sparkles, Sliders, CheckCircle2, RotateCw, UploadCloud, X, AlertCircle } from 'lucide-react';
import { Episode, PerformanceBrief, AudioRender, AudioStatus } from '../types';
import { api } from '../api/client';

interface AudioStudioModalProps {
  episode: Episode;
  seriesTitle: string;
  onClose: () => void;
  onEpisodeUpdated: () => void;
}

export const AudioStudioModal: React.FC<AudioStudioModalProps> = ({
  episode,
  seriesTitle,
  onClose,
  onEpisodeUpdated,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [showConfirmPublish, setShowConfirmPublish] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [audioStatus, setAudioStatus] = useState<AudioStatus>(episode.audio_status || 'none');
  const [publishedAt, setPublishedAt] = useState<string | null>(episode.published_at || null);
  const [latestRender, setLatestRender] = useState<AudioRender | null>(null);
  const [brief, setBrief] = useState<PerformanceBrief | null>(null);

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [activeTab, setActiveTab] = useState<'player' | 'brief'>('player');

  useEffect(() => {
    loadAudioData();
  }, [episode.id]);

  const loadAudioData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAudioStatus(episode.id);
      setAudioStatus(data.audio_status as AudioStatus);
      setPublishedAt(data.published_at);
      if (data.latest_render) {
        setLatestRender(data.latest_render);
        if (data.latest_render.performance_brief) {
          setBrief(data.latest_render.performance_brief);
        }
      } else {
        // If no render exists yet, fetch direction brief
        const dirData = await api.getAudioDirection(episode.id);
        setBrief(dirData.performance_brief);
      }
    } catch (err: any) {
      console.error('Error loading audio data:', err);
      setError(err.message || 'Failed to load audio studio details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    setGenerating(true);
    setError(null);
    try {
      const currentBrief = brief || (await api.getAudioDirection(episode.id)).performance_brief;
      const res = await api.generateAudio(episode.id, currentBrief);
      setAudioStatus('ready_to_review');
      setLatestRender(res.render);
      if (res.render.performance_brief) {
        setBrief(res.render.performance_brief);
      }
      onEpisodeUpdated();
    } catch (err: any) {
      console.error('Audio Generation Error:', err);
      setError(err.message || 'Audio generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishAudio = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await api.publishAudio(episode.id);
      setAudioStatus('published');
      setPublishedAt(res.published_at);
      setShowConfirmPublish(false);
      onEpisodeUpdated();
    } catch (err: any) {
      console.error('Publish Audio Error:', err);
      setError(err.message || 'Failed to publish audio');
    } finally {
      setPublishing(false);
    }
  };

  const togglePlayback = () => {
    if (!latestRender?.audio_url) return;

    if (!audioElement) {
      const audio = new Audio(latestRender.audio_url);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '820px', width: '100%', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-red)' }}>
              Audio Drama Production Studio &bull; {seriesTitle}
            </div>
            <h2 style={{ fontSize: '1.35rem', marginTop: '0.2rem' }}>
              Episode {episode.episode_number}: {episode.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {audioStatus === 'none' && <span className="badge-pill badge-draft">No Audio</span>}
            {audioStatus === 'generating' && <span className="badge-pill badge-analyzed"><RotateCw size={12} className="spin" /> Generating</span>}
            {audioStatus === 'ready_to_review' && <span className="badge-pill" style={{ borderColor: '#8B5CF6', color: '#A78BFA', background: 'rgba(139, 92, 246, 0.15)' }}><Sparkles size={12} /> Ready to Review</span>}
            {audioStatus === 'published' && <span className="badge-pill badge-finalized"><CheckCircle2 size={12} /> Published Audio</span>}

            <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem' }} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Studio Content */}
        <div style={{ padding: '1.75rem', maxHeight: '72vh', overflowY: 'auto' }}>
          {error && (
            <div style={{
              background: 'rgba(217, 30, 54, 0.12)',
              border: '1px solid var(--accent-red)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--ink-primary)',
              fontSize: '0.85rem',
            }}>
              <AlertCircle size={18} className="accent-text" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
              <RotateCw size={28} className="spin" style={{ marginBottom: '1rem', color: 'var(--accent-red)' }} />
              <div>Initializing Master Audio Studio & Performance Brief...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Audio Controls / Waveform Panel */}
              <div className="panel panel-accent panel-glow" style={{ padding: '1.5rem', background: 'var(--bg-panel-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Volume2 className="accent-text" size={22} />
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                        {latestRender ? `Master Audio Mix (${latestRender.duration_seconds}s)` : 'No Audio Master Generated Yet'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        Voice Archetype: <span style={{ color: 'var(--ink-primary)', fontWeight: 600 }}>{brief?.voice_name || brief?.voice_id || 'Veteran Narrator'}</span>
                      </div>
                    </div>
                  </div>

                  {latestRender && (
                    <button className="btn btn-primary" onClick={togglePlayback} style={{ borderRadius: 'var(--radius-pill)', padding: '0.6rem 1.35rem' }}>
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      {isPlaying ? 'Pause Playback' : 'Play Master Audio'}
                    </button>
                  )}
                </div>

                {/* Simulated Audio Waveform Bar */}
                <div style={{
                  height: '48px',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0 1rem',
                  overflow: 'hidden',
                }}>
                  {Array.from({ length: 48 }).map((_, i) => {
                    const height = isPlaying ? Math.floor(Math.sin(i + Date.now() * 0.005) * 16 + 22) : Math.floor(Math.sin(i) * 12 + 18);
                    return (
                      <div key={i} style={{
                        flex: 1,
                        height: `${height}px`,
                        background: isPlaying ? 'var(--accent-red)' : 'var(--accent-red-dim)',
                        borderRadius: '2px',
                        transition: 'height 0.15s ease',
                      }} />
                    );
                  })}
                </div>
              </div>

              {/* Tabs for Performance Brief */}
              <div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                  <button
                    className={`btn ${activeTab === 'player' ? 'btn-secondary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('player')}
                    style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'player' ? '2px solid var(--accent-red)' : 'none' }}
                  >
                    <Sliders size={16} /> Direction & Performance Brief
                  </button>
                </div>

                {/* Editable Performance Brief Panel */}
                {brief && (
                  <div className="panel" style={{ background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>
                          Voice Archetype Name
                        </label>
                        <input
                          type="text"
                          value={brief.voice_name || ''}
                          onChange={e => setBrief({ ...brief, voice_name: e.target.value })}
                          style={{ marginTop: '0.35rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>
                          ElevenLabs Voice ID
                        </label>
                        <input
                          type="text"
                          value={brief.voice_id}
                          onChange={e => setBrief({ ...brief, voice_id: e.target.value })}
                          style={{ marginTop: '0.35rem' }}
                        />
                      </div>
                    </div>

                    {/* Ambience & Volume Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>
                          Background Ambience Description (SFX Bed)
                        </label>
                        <input
                          type="text"
                          value={brief.ambience_description}
                          onChange={e => setBrief({ ...brief, ambience_description: e.target.value })}
                          placeholder="e.g. Midnight rain with foghorns and distant thunder"
                          style={{ marginTop: '0.35rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>
                          Ambience Volume ({brief.ambience_volume_db} dB)
                        </label>
                        <input
                          type="range"
                          min="-30"
                          max="-6"
                          step="1"
                          value={brief.ambience_volume_db}
                          onChange={e => setBrief({ ...brief, ambience_volume_db: parseFloat(e.target.value) })}
                          style={{ width: '100%', marginTop: '0.75rem', accentColor: 'var(--accent-red)' }}
                        />
                      </div>
                    </div>

                    {/* Voice Settings Sliders */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--accent-red)', textTransform: 'uppercase' }}>
                        Voice Performance Parameters
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Stability ({brief.voice_settings.stability})</div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={brief.voice_settings.stability}
                            onChange={e => setBrief({
                              ...brief,
                              voice_settings: { ...brief.voice_settings, stability: parseFloat(e.target.value) }
                            })}
                            style={{ width: '100%', accentColor: 'var(--accent-red)' }}
                          />
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Similarity Boost ({brief.voice_settings.similarity_boost})</div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={brief.voice_settings.similarity_boost}
                            onChange={e => setBrief({
                              ...brief,
                              voice_settings: { ...brief.voice_settings, similarity_boost: parseFloat(e.target.value) }
                            })}
                            style={{ width: '100%', accentColor: 'var(--accent-red)' }}
                          />
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Style Exaggeration ({brief.voice_settings.style})</div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={brief.voice_settings.style}
                            onChange={e => setBrief({
                              ...brief,
                              voice_settings: { ...brief.voice_settings, style: parseFloat(e.target.value) }
                            })}
                            style={{ width: '100%', accentColor: 'var(--accent-red)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'var(--bg-panel)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button className="btn btn-secondary" onClick={handleGenerateAudio} disabled={generating}>
            {generating ? <RotateCw size={16} className="spin" /> : <Sparkles size={16} />}
            {generating ? 'Producing Audio Master...' : latestRender ? 'Re-Generate Audio Master' : 'Convert to Audio Master'}
          </button>

          {/* Explicit Publish Action Separation */}
          {audioStatus === 'ready_to_review' && !showConfirmPublish && (
            <button className="btn btn-primary" onClick={() => setShowConfirmPublish(true)} style={{ background: '#10B981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
              <UploadCloud size={16} />
              Publish Audio Episode
            </button>
          )}

          {showConfirmPublish && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #10B981' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Confirm Publish Audio Episode?</span>
              <button className="btn btn-primary" style={{ background: '#10B981', padding: '0.35rem 0.85rem' }} onClick={handlePublishAudio} disabled={publishing}>
                {publishing ? <RotateCw size={14} className="spin" /> : <CheckCircle2 size={14} />}
                Confirm & Publish
              </button>
              <button className="btn btn-outline" style={{ padding: '0.35rem 0.65rem' }} onClick={() => setShowConfirmPublish(false)}>
                Cancel
              </button>
            </div>
          )}

          {audioStatus === 'published' && (
            <div style={{ fontSize: '0.8rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              Published {publishedAt ? new Date(publishedAt).toLocaleDateString() : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
