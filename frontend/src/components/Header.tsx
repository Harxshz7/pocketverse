import React from 'react';
import { Sparkles, Plus, BookOpen, Layers } from 'lucide-react';
import { Series } from '../types';

interface HeaderProps {
  seriesList: Series[];
  selectedSeries: Series | null;
  onSelectSeries: (series: Series) => void;
  onOpenNewSeriesModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  seriesList,
  selectedSeries,
  onSelectSeries,
  onOpenNewSeriesModal,
}) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 0',
      marginBottom: '1.5rem',
      borderBottom: '1px solid var(--border-accent)',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textDecoration: 'none',
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Layers size={22} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '0.05em' }}>
              POCKET<span style={{ color: 'var(--accent-red)' }}>VERSE</span>
            </h1>
            <div className="eyebrow" style={{ fontSize: '0.6rem', marginTop: '2px', color: 'var(--ink-muted)' }}>
              Serialized Story Command Center
            </div>
          </div>
        </div>

        {/* Series Switcher Dropdown */}
        {seriesList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Series:
            </span>
            <select
              value={selectedSeries?.id || ''}
              onChange={(e) => {
                const s = seriesList.find((item) => item.id === e.target.value);
                if (s) onSelectSeries(s);
              }}
              style={{
                width: 'auto',
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: 'var(--bg-panel-elevated)',
                border: '1px solid var(--border-accent)',
                color: 'var(--ink-primary)',
              }}
            >
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.episodes?.length || 0} Ep)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Action Controls & Creator Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--accent-red-subtle)',
          border: '1px solid var(--accent-red-dim)',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--accent-red)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-red)', boxShadow: '0 0 6px var(--accent-red)' }} />
          Creator Identity Mode
        </div>

        <button className="btn btn-primary" onClick={onOpenNewSeriesModal}>
          <Plus size={16} />
          New Series
        </button>
      </div>
    </header>
  );
};
