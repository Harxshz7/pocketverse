import React, { useState, useEffect } from 'react';
import { Volume2, Play, Pause, RotateCw, CheckCircle2, Sliders, Music, ShieldCheck, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Episode, PerformanceBrief, AudioRender, VoiceSettings } from '../types';
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
  const [loadingBrief, setLoadingBrief] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [brief, setBrief] = useState<PerformanceBrief | null>(null);
  const [latestRender, setLatestRender] = useState<AudioRender | null>(null);
  const [audioStatus, setAudioStatus] = useState<string>(episode.audio_status || 'none');
  const [publishedAt, setPublishedAt] = useState<string | null>(episode.published_at || null);

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // UI accordion toggles
  const [isBriefExpanded, setIsBriefExpanded] = useState<boolean>(true);
  const [showConfirmPublish, setShowConfirmPublish] = useState<boolean>(false);

  useEffect(() => {
    loadAudioStudioData();
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [episode.id]);

  useEffect(() => {
    // Reset audio player whenever a new audio render is generated
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
    }
  }, [latestRender?.audio_url]);

  const loadAudioStudioData = async () => {
    setLoadingBrief(true);
    setError(null);
    try {
      // 1. Fetch current audio render state
      const audioData = await api.getAudioStatus(episode.id);
      setAudioStatus(audioData.audio_status);
      setPublishedAt(audioData.published_at);

      if (audioData.latest_render) {
        setLatestRender(audioData.latest_render);
        setBrief(audioData.latest_render.performance_brief);
      } else {
        // 2. No render yet: call Direction API to create LLM Performance Brief
        const dirData = await api.getAudioDirection(episode.id);
        setBrief(dirData.performance_brief);
      }
    } catch (err: any) {
      console.error('Error loading Audio Studio data:', err);
      setError(err.message || 'Failed to initialize Audio Studio');
    } finally {
      setLoadingBrief(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!brief) return;
    setGenerating(true);
    setError(null);
    setPlaybackError(null);
    try {
      const res = await api.generateAudio(episode.id, brief);
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
    setPlaybackError(null);

    if (!audioElement) {
      const audio = new Audio(latestRender.audio_url);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setPlaybackError('Audio file playback failed. Ensure ./start.sh server is running.');
      };

      audio.play()
        .then(() => {
          setAudioElement(audio);
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Playback Error:', err);
          setPlaybackError('Playback interrupted by browser. Click Play again to listen.');
          setIsPlaying(false);
        });
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error('Playback Error:', err);
            setPlaybackError('Playback error. Click Play again.');
            setIsPlaying(false);
          });
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '840px', width: '100%', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
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

          <button onClick={onClose} className="btn-outline" style={{ border: 'none', padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Studio Status Bar */}
        <div style={{
          padding: '0.85rem 1.75rem',
          background: 'var(--bg-panel-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Audio Status:</span>
            {audioStatus === 'published' ? (
              <span className="badge-pill badge-finalized">
                <CheckCircle2 size={12} /> Published Audio Episode
              </span>
            ) : audioStatus === 'ready_to_review' ? (
              <span className="badge-pill" style={{ borderColor: '#8B5CF6', color: '#A78BFA', background: 'rgba(139, 92, 246, 0.15)' }}>
                <Sparkles size={12} /> Ready to Review (Not Published)
              </span>
            ) : generating ? (
              <span className="badge-pill badge-analyzed">
                <RotateCw size={12} className="spin" /> Rendering Master Track...
              </span>
            ) : (
              <span className="badge-pill badge-draft">No Audio Render</span>
            )}
          </div>

          {publishedAt && (
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
              Published: {new Date(publishedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Body Container */}
        <div style={{ padding: '1.75rem', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              background: 'rgba(217, 30, 54, 0.15)',
              border: '1px solid var(--accent-red-dim)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-red)',
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          {playbackError && (
            <div style={{
              background: 'rgba(217, 119, 6, 0.15)',
              border: '1px solid rgba(217, 119, 6, 0.4)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: '#FBBF24',
              fontSize: '0.85rem',
            }}>
              {playbackError}
            </div>
          )}

          {/* Master Audio Track Player */}
          {latestRender ? (
            <div className="panel panel-accent" style={{ padding: '1.5rem', background: 'var(--bg-void)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={togglePlayback}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: isPlaying ? 'var(--bg-panel-elevated)' : 'var(--accent-red)',
                      border: '1px solid var(--accent-red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-glow)',
                    }}
                  >
                    {isPlaying ? <Pause size={22} color="#FFF" /> : <Play size={22} color="#FFF" style={{ marginLeft: '3px' }} />}
                  </button>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {brief?.voice_name || 'Master Audio Track'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                      Duration: {latestRender.duration_seconds}s &bull; Tone: {brief?.ambience_description ? 'Mixed Ambience' : 'Clean Narration'}
                    </div>
                  </div>
                </div>

                {audioStatus !== 'published' ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowConfirmPublish(true)}
                    disabled={publishing}
                    style={{ background: '#10B981', borderColor: '#10B981', padding: '0.65rem 1.25rem' }}
                  >
                    <CheckCircle2 size={16} /> Publish Audio Episode
                  </button>
                ) : (
                  <span className="badge-pill badge-finalized" style={{ padding: '0.4rem 0.85rem' }}>
                    <ShieldCheck size={14} /> Published Live
                  </span>
                )}
              </div>

              {/* Animated Waveform Visualizer */}
              <div style={{
                height: '44px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '0 1rem',
              }}>
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: isPlaying ? `${Math.floor(Math.random() * 28 + 8)}px` : '10px',
                      background: isPlaying ? 'var(--accent-red)' : 'var(--ink-dim)',
                      borderRadius: '2px',
                      transition: 'height 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: '2rem 1.5rem', background: 'var(--bg-void)' }}>
              <Volume2 size={36} color="var(--accent-red)" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>No Audio Master Rendered Yet</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', maxWidth: '520px', margin: '0 auto 1.25rem' }}>
                Review the AI Performance Brief below, then click "Generate Directed Audio Master" to synthesize the narration and mix background ambience.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleGenerateAudio}
                disabled={generating || loadingBrief}
                style={{ padding: '0.75rem 1.75rem' }}
              >
                {generating ? (
                  <>
                    <RotateCw size={16} className="spin" /> Synthesizing Audio Master...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate Directed Audio Master
                  </>
                )}
              </button>
            </div>
          )}

          {/* Collapsible Performance Brief Controls */}
          {brief && (
            <div className="panel" style={{ padding: '1.25rem' }}>
              <div
                onClick={() => setIsBriefExpanded(!isBriefExpanded)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Sliders size={18} className="accent-text" />
                  <h3 style={{ fontSize: '0.95rem', margin: 0 }}>DIRECTED PERFORMANCE BRIEF PARAMETERS</h3>
                </div>
                {isBriefExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {isBriefExpanded && (
                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Voice Selector & Settings Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>Directed Voice Archetype</label>
                      <input
                        type="text"
                        value={brief.voice_name || brief.voice_id}
                        onChange={e => setBrief({ ...brief, voice_name: e.target.value })}
                        placeholder="Voice Archetype Name"
                      />
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>Voice Stability ({brief.voice_settings.stability})</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={brief.voice_settings.stability}
                        onChange={e => setBrief({
                          ...brief,
                          voice_settings: { ...brief.voice_settings, stability: parseFloat(e.target.value) },
                        })}
                      />
                    </div>
                  </div>

                  {/* Ambience & Volume */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>
                        <Music size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Background Ambience Bed Description
                      </label>
                      <input
                        type="text"
                        value={brief.ambience_description}
                        onChange={e => setBrief({ ...brief, ambience_description: e.target.value })}
                        placeholder="Atmospheric sound bed description..."
                      />
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: 'block', marginBottom: '0.35rem' }}>
                        Ambience Volume ({brief.ambience_volume_db} dB)
                      </label>
                      <input
                        type="range"
                        min="-30"
                        max="-6"
                        step="1"
                        value={brief.ambience_volume_db}
                        onChange={e => setBrief({ ...brief, ambience_volume_db: parseInt(e.target.value, 10) })}
                      />
                    </div>
                  </div>

                  {/* Pacing Notes List */}
                  <div>
                    <label className="eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Director Pacing Notes & Dramatic Pauses ({brief.pacing_notes.length})
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                      {brief.pacing_notes.map((note, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderLeft: '2px solid var(--accent-red-dim)',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-primary)' }}>"{note.text_span}"</span>
                          <span className="badge-pill badge-analyzed" style={{ fontSize: '0.65rem' }}>
                            Pause: {note.pause_ms}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Re-Generate Master Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      className="btn btn-outline"
                      onClick={handleGenerateAudio}
                      disabled={generating}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <RotateCw size={14} className={generating ? 'spin' : ''} />
                      {generating ? 'Re-Generating Master...' : 'Re-Generate Audio Master with Parameters'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explicit Publish Modal Confirmation Drawer */}
        {showConfirmPublish && (
          <div style={{
            padding: '1.25rem 1.75rem',
            background: 'rgba(16, 185, 129, 0.12)',
            borderTop: '1px solid #10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#10B981', fontSize: '0.95rem' }}>
                Confirm Audio Episode Publication?
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                This explicitly marks the episode audio status as PUBLISHED for listeners.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setShowConfirmPublish(false)} disabled={publishing}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePublishAudio}
                disabled={publishing}
                style={{ background: '#10B981', borderColor: '#10B981' }}
              >
                {publishing ? 'Publishing...' : 'Confirm & Publish Live'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
