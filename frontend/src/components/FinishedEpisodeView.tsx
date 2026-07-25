import React from 'react';
import { ArrowLeft, CheckCircle2, FileText, Sparkles, BookOpen, Volume2 } from 'lucide-react';
import { Episode } from '../types';

interface FinishedEpisodeViewProps {
  episode: Episode;
  seriesTitle: string;
  analysisRun?: any;
  onBackToEditor: () => void;
  onOpenAudioStudio?: () => void;
}

export const FinishedEpisodeView: React.FC<FinishedEpisodeViewProps> = ({
  episode,
  seriesTitle,
  analysisRun,
  onBackToEditor,
  onOpenAudioStudio,
}) => {
  const paragraphs = episode.content.split(/\n+/).filter(p => p.trim());

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '950px', margin: '0 auto', width: '100%' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-outline" onClick={onBackToEditor}>
          <ArrowLeft size={16} />
          Back to Editor
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge-pill badge-finalized">
            <span className="badge-dot" />
            FINALIZED & PUBLISHED TEXT
          </span>

          {onOpenAudioStudio && (
            <button className="btn btn-primary" onClick={onOpenAudioStudio} style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--accent-red)' }}>
              <Volume2 size={16} className="accent-text" />
              {episode.audio_status && episode.audio_status !== 'none' ? 'Open Audio Studio' : 'Convert Finalized Episode to Audio'}
            </button>
          )}
        </div>
      </div>

      {/* Script Header Card */}
      <div className="panel panel-accent" style={{ textAlign: 'center', padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-glow" style={{ height: '260px' }} />
        
        <div className="eyebrow" style={{ marginBottom: '0.4rem', color: 'var(--accent-red)' }}>
          {seriesTitle} &bull; Episode {episode.episode_number}
        </div>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          {episode.title}
        </h1>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.85rem',
          fontSize: '0.8rem',
          color: 'var(--ink-muted)',
          background: 'rgba(0,0,0,0.4)',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-subtle)',
        }}>
          <span>{paragraphs.length} Paragraphs</span>
          <span>&bull;</span>
          <span>{episode.content.trim().split(/\s+/).length} Words</span>
          <span>&bull;</span>
          <span>Finalized {new Date(episode.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Analysis Diagnostic Summary Badge */}
      {analysisRun && (
        <div className="panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: 'var(--border-accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles className="accent-text" size={18} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>AI Diagnostic Pass Completed</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                Continuity verified against Episode {Math.max(1, episode.episode_number - 1)} &bull; Copyedited & Style Refined
              </div>
            </div>
          </div>
          <span className="badge-pill badge-finalized">
            <CheckCircle2 size={12} /> Verified Script
          </span>
        </div>
      )}

      {/* Formatted Script Body Reader Surface with Bounded Height & Custom Scrollbar */}
      <article className="panel" style={{
        padding: '2.5rem 3rem',
        background: 'var(--bg-panel-elevated)',
        border: '1px solid var(--border-subtle)',
        lineHeight: 1.85,
        fontSize: '1.05rem',
        color: 'var(--ink-primary)',
        boxShadow: 'var(--shadow-panel)',
        maxHeight: '480px',
        overflowY: 'auto',
      }}>
        {paragraphs.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--ink-muted)' }}>No content in this finalized script.</p>
        ) : (
          paragraphs.map((p, index) => (
            <p key={index} style={{ marginBottom: '1.35rem', textIndent: p.startsWith('[') || p.startsWith('"') || p.startsWith("'") ? 0 : '1.25rem' }}>
              {p}
            </p>
          ))
        )}
      </article>
    </main>
  );
};
