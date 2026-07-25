import { useState, useCallback, useEffect } from 'react';
import { Upload as UploadIcon, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import LoadingState from '../components/LoadingState';
import { ingestEpisode, listEpisodes } from '../services/api';

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
    } catch (_) {
      // Ignore — will use mock
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-verse-red-dim">
          <UploadIcon size={20} className="text-verse-red" />
        </div>
        <div>
          <h1 className="heading-lg text-verse-text">Ingest Episode</h1>
          <p className="text-verse-text-muted text-sm mt-0.5">
            Upload episode text to build the Story Memory Graph
          </p>
        </div>
      </div>

      {/* Existing episodes */}
      {episodes.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono mb-3">
            Ingested Episodes
          </h3>
          <div className="flex flex-wrap gap-2">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-verse-black rounded-lg border border-verse-border text-sm"
              >
                <FileText size={12} className="text-verse-red" />
                <span className="mono text-verse-text-muted text-xs">EP{ep.number}</span>
                <span className="text-verse-text-secondary">{ep.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload state machine */}
      {status === 'idle' || status === 'error' ? (
        <div className="card p-6">
          <UploadZone onSubmit={handleSubmit} loading={false} />
          {status === 'error' && (
            <div className="mt-4 p-3 bg-verse-red-dim/50 border border-verse-red/20 rounded-lg text-verse-red text-sm animate-fade-in">
              {error}
            </div>
          )}
        </div>
      ) : status === 'extracting' ? (
        <div className="card p-6">
          <LoadingState
            type="extraction"
            message="Building Story Memory Graph..."
          />
        </div>
      ) : status === 'done' ? (
        <div className="card p-8 text-center space-y-5 animate-fade-in">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full bg-verse-green-dim flex items-center justify-center mx-auto glow-green">
              <CheckCircle2 size={32} className="text-verse-green" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="heading-md text-verse-text">Episode Ingested</h2>
            {lastIngested && (
              <p className="text-verse-text-secondary">
                Episode {lastIngested.number}: {lastIngested.title}
              </p>
            )}
          </div>
          <p className="text-verse-text-muted text-sm max-w-md mx-auto">
            The Story Memory Graph has been updated with characters, events, relationships, and rules from this episode.
          </p>
          <div className="flex justify-center gap-3">
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
  );
}
