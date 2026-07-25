import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Eye } from 'lucide-react';
import { Episode } from '../types';

interface EpisodeEditorProps {
  episode: Episode;
  onSaveContent: (title: string, content: string) => Promise<void>;
  onLaunchWizard: () => void;
  onViewFinalized: () => void;
}

export const EpisodeEditor: React.FC<EpisodeEditorProps> = ({
  episode,
  onSaveContent,
  onLaunchWizard,
  onViewFinalized,
}) => {
  const [title, setTitle] = useState(episode.title);
  const [content, setContent] = useState(episode.content);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setTitle(episode.title);
    setContent(episode.content);
    setHasUnsavedChanges(false);
  }, [episode.id, episode.title, episode.content]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveContent(title, content);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving episode content:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchWizardClick = async () => {
    // Automatically save unsaved changes before launching the wizard!
    if (hasUnsavedChanges || title !== episode.title || content !== episode.content) {
      setSaving(true);
      try {
        await onSaveContent(title, content);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Error auto-saving content before launching wizard:', err);
      } finally {
        setSaving(false);
      }
    }
    onLaunchWizard();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controls Bar */}
      <div className="panel panel-accent" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
      }}>
        <div style={{ flex: 1, marginRight: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span className="eyebrow">Episode {episode.episode_number}</span>
            <span className={`badge-pill badge-${episode.status}`}>
              <span className="badge-dot" />
              {episode.status}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Episode Title (e.g., King Vikrama & Betala)..."
            style={{
              fontSize: '1.4rem',
              fontFamily: 'var(--font-headline)',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid transparent',
              padding: '0.2rem 0',
              color: 'var(--ink-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {episode.status === 'finalized' && (
            <button className="btn btn-secondary" onClick={onViewFinalized}>
              <Eye size={16} />
              Reader View
            </button>
          )}

          <button className="btn btn-primary" onClick={handleLaunchWizardClick} disabled={saving}>
            <Sparkles size={16} />
            Launch AI Analysis
          </button>
        </div>
      </div>

      {/* Editor Body Surface */}
      <div className="panel" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        minHeight: '480px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          fontSize: '0.75rem',
          color: 'var(--ink-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          <span>Draft Script Surface</span>
          <span>{wordCount} Words &bull; {charCount} Characters</span>
        </div>

        <textarea
          value={content}
          onChange={handleTextChange}
          placeholder="Write or paste your episode script text here..."
          style={{
            flex: 1,
            width: '100%',
            minHeight: '400px',
            background: 'rgba(11, 7, 8, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            fontFamily: 'var(--font-body)',
            fontSize: '1.05rem',
            lineHeight: 1.75,
            color: 'var(--ink-primary)',
          }}
        />

        <div style={{
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--ink-dim)',
        }}>
          <span>
            {hasUnsavedChanges ? '⚠️ Unsaved draft changes (will auto-save on AI Analysis)' : '✓ All changes saved'}
          </span>
          <span>
            Tip: Run AI Analysis to check plot continuity against Episode {Math.max(1, episode.episode_number - 1)}.
          </span>
        </div>
      </div>
    </main>
  );
};
