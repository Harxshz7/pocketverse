import React, { useState } from 'react';
import { X, Sparkles, FolderPlus } from 'lucide-react';

interface SeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSeries: (title: string) => Promise<void>;
}

export const SeriesModal: React.FC<SeriesModalProps> = ({
  isOpen,
  onClose,
  onCreateSeries,
}) => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a series title');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onCreateSeries(title.trim());
      setTitle('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create series');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FolderPlus size={24} className="accent-text" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Create New Series</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-outline"
            style={{ padding: '0.4rem', borderRadius: '50%', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ink-muted)' }}>
              Series Title
            </label>
            <input
              type="text"
              placeholder="e.g. Neon Horizon: Season 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={loading}
            />
            {error && (
              <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {error}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Initializing...' : 'Create Series'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
