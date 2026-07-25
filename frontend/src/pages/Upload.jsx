import { useState, useCallback, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers3,
  Radio,
  Upload as UploadIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import LoadingState from '../components/LoadingState';
import CinematicScene from '../components/CinematicScene';
import { ingestEpisode, listEpisodes } from '../services/api';

const INGEST_STEPS = [
  { label: 'Raw script', value: 'paste or txt' },
  { label: 'Extractor', value: 'structured output' },
  { label: 'Memory graph', value: 'canon update' },
];

export default function Upload() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | extracting | done | error
  const [error, setError] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [lastIngested, setLastIngested] = useState(null);

  const fetchEpisodes = useCallback(async () => {
    try {
      const data = await listEpisodes();
      setEpisodes(data);
    } catch {
      // The API layer already falls back to mock data when possible.
    }
  }, []);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handleSubmit = async (data) => {
    setStatus('extracting');
    setError('');
    try {
      const result = await ingestEpisode(data);
      setLastIngested(result);
      setStatus('done');
      fetchEpisodes();
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Failed to ingest episode');
    }
  };

  return (
    <div className="page-shell space-y-6">
      <section className="page-spotlight">
        <div className="relative z-10 space-y-5">
          <div className="hero-kicker mono">
            <UploadIcon size={14} className="text-verse-red" />
            <strong>Episode intake</strong>
            <span>Extraction-ready workspace</span>
          </div>
          <div className="space-y-3">
            <h1 className="page-title">Feed the story engine.</h1>
            <p className="page-subtitle">
              Upload episode text and PocketVerse will extract characters, turning points,
              relationships, promises, secrets, and world rules into the Story Memory Graph.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            {INGEST_STEPS.map(({ label, value }) => (
              <div key={label} className="stat-card">
                <p>{label}</p>
                <strong className="!text-base !font-bold !font-[var(--font-heading)]">
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </div>
        <CinematicScene variant="upload" compact />
      </section>

      {episodes.length > 0 && (
        <section className="glass-panel p-4 md:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="feature-card-icon !w-10 !h-10 !rounded-xl">
              <Layers3 size={18} />
            </div>
            <div>
              <h2 className="heading-md text-verse-text">Ingested Episodes</h2>
              <p className="text-sm text-verse-text-muted">
                Current story canon available to the validation engine.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="input-shell p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-verse-red-dim border border-verse-red/20 flex items-center justify-center">
                  <FileText size={16} className="text-verse-red" />
                </div>
                <div className="min-w-0">
                  <span className="mono text-verse-red text-xs">EP{ep.number}</span>
                  <p className="text-verse-text text-sm font-semibold truncate">{ep.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="command-panel">
        <div className="relative z-10 p-5 md:p-7">
          {status === 'idle' || status === 'error' ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="feature-card-icon !w-11 !h-11">
                  <Radio size={20} />
                </div>
                <div>
                  <h2 className="heading-md text-verse-text">Episode payload</h2>
                  <p className="text-sm text-verse-text-muted">
                    Paste text or drop a .txt file. The backend API contract stays unchanged.
                  </p>
                </div>
              </div>
              <UploadZone onSubmit={handleSubmit} loading={false} />
              {status === 'error' && (
                <div className="mt-4 p-3 bg-verse-red-dim/50 border border-verse-red/20 rounded-lg text-verse-red text-sm animate-fade-in">
                  {error}
                </div>
              )}
            </>
          ) : status === 'extracting' ? (
            <LoadingState
              type="extraction"
              message="Building Story Memory Graph..."
            />
          ) : status === 'done' ? (
            <div className="text-center space-y-6 py-10 animate-fade-in">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-3xl bg-verse-green-dim flex items-center justify-center mx-auto glow-green border border-verse-green/20">
                  <CheckCircle2 size={40} className="text-verse-green" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="page-title !text-4xl md:!text-5xl">Canon updated.</h2>
                {lastIngested && (
                  <p className="text-verse-text-secondary">
                    Episode {lastIngested.number}: {lastIngested.title}
                  </p>
                )}
              </div>
              <p className="text-verse-text-muted text-sm max-w-xl mx-auto leading-relaxed">
                Characters, events, relationships, promises, secrets, and rules are now
                available to the Story Memory Graph.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => navigate('/memory')}
                  className="btn-secondary text-sm"
                >
                  View Story Memory
                </button>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setLastIngested(null);
                  }}
                  className="btn-secondary text-sm"
                >
                  Upload Another
                </button>
                <button
                  onClick={() => navigate('/review')}
                  className="btn-primary text-sm"
                >
                  Validate
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
