import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import IssueCard from '../components/IssueCard';
import LoadingState from '../components/LoadingState';
import UploadZone from '../components/UploadZone';
import {
  generateFinalVersion,
  getEpisode,
  getIssues,
  ingestEpisode,
  listEpisodes,
  recordPatchDecision,
  validateEpisode,
} from '../services/api';

function EmptyState({ onAdd }) {
  return (
    <div className="glass-panel p-8 md:p-12 text-center space-y-5">
      <div className="feature-card-icon !w-14 !h-14 mx-auto">
        <RadioTower size={26} />
      </div>
      <div className="space-y-2">
        <h2 className="heading-md text-verse-text">Start your story analysis</h2>
        <p className="text-sm text-verse-text-muted max-w-xl mx-auto leading-relaxed">
          Add episode text from your Pocket FM-style serialized story. PocketVerse will
          extract story memory, validate continuity, and produce a final version after fixes.
        </p>
      </div>
      <button onClick={onAdd} className="btn-primary mx-auto">
        <Plus size={16} />
        Add First Episode
      </button>
    </div>
  );
}

function FinalPreview({ preview }) {
  if (!preview) return null;

  const acceptedPatches = preview.issues.filter((issue) =>
    issue.patch_decision?.action === 'accept_variant'
    && issue.patch_decision?.original_span
    && issue.patch_decision?.rewritten_text
  );

  return (
    <section className="glass-panel p-4 md:p-5 space-y-5 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="feature-card-icon !w-10 !h-10 !rounded-xl">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="heading-md text-verse-text">
              Final Story Version / EP{preview.episodeId} v{preview.version.version_number}
            </h2>
            <p className="text-sm text-verse-text-muted mt-1">
              This is the clean before/after view for the selected episode.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-verse-green-dim border border-verse-green/20 text-verse-green text-xs mono">
            {preview.resolved_count} resolved
          </span>
          <span className="px-3 py-1 rounded-full bg-verse-black border border-verse-border text-verse-text-muted text-xs mono">
            {preview.remaining_count} remaining
          </span>
        </div>
      </div>

      {acceptedPatches.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono">
            Accepted changes
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {acceptedPatches.map((issue) => (
              <div key={issue.id} className="glass-panel p-4 space-y-3">
                <p className="text-xs mono text-verse-red uppercase tracking-wider">
                  {issue.category.replace(/_/g, ' ')}
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-verse-text-muted uppercase mono">Original</p>
                  <p className="text-sm text-verse-text-secondary leading-relaxed border-l-2 border-verse-red/40 pl-3">
                    {issue.patch_decision.original_span}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-verse-green uppercase mono">Accepted rewrite</p>
                  <p className="text-sm text-verse-text leading-relaxed border-l-2 border-verse-green/50 pl-3">
                    {issue.patch_decision.rewritten_text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-bold tracking-wider text-verse-green uppercase mono">
          Final episode text
        </h3>
        <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-xl bg-verse-black/70 border border-verse-green/20 p-4 text-sm leading-relaxed text-verse-text">
          {preview.final_text}
        </pre>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [issues, setIssues] = useState([]);
  const [finalPreview, setFinalPreview] = useState(null);
  const [showAddEpisode, setShowAddEpisode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [episodeLoading, setEpisodeLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [decisionLoadingId, setDecisionLoadingId] = useState(null);
  const [finalLoading, setFinalLoading] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [error, setError] = useState('');

  const loadEpisodes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listEpisodes();
      setEpisodes(data);
      setSelectedEpisodeId((current) => current || data[0]?.id || null);
      setShowAddEpisode(data.length === 0);
    } catch (err) {
      setError(err.message || 'Failed to load episodes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEpisodes();
  }, [loadEpisodes]);

  useEffect(() => {
    if (!selectedEpisodeId) {
      setSelectedEpisode(null);
      setIssues([]);
      setAnalysisCompleted(false);
      return;
    }

    let cancelled = false;
    async function loadSelectedEpisode() {
      setEpisodeLoading(true);
      setError('');
      setFinalPreview(null);
      try {
        const [episode, episodeIssues] = await Promise.all([
          getEpisode(selectedEpisodeId),
          getIssues(selectedEpisodeId),
        ]);
        if (!cancelled) {
          setSelectedEpisode(episode);
          setIssues(episodeIssues);
          setAnalysisCompleted(episodeIssues.length > 0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load selected episode');
      } finally {
        if (!cancelled) setEpisodeLoading(false);
      }
    }

    loadSelectedEpisode();
    return () => {
      cancelled = true;
    };
  }, [selectedEpisodeId]);

  useEffect(() => {
    setAnalysisCompleted(false);
  }, [selectedEpisodeId]);

  const stats = useMemo(() => ({
    episodes: episodes.length,
    issues: issues.length,
    open: issues.filter((issue) => !issue.resolved).length,
    resolved: issues.filter((issue) => issue.resolved).length,
  }), [episodes.length, issues]);

  const nextEpisodeNumber = useMemo(() => {
    if (episodes.length === 0) return 1;
    const numbers = episodes.map((e) => e.number || 0);
    return Math.max(...numbers, 0) + 1;
  }, [episodes]);

  const canGenerateFinal = issues.some((issue) =>
    !issue.resolved && issue.patch_decision?.action === 'accept_variant'
  );

  const handleAddEpisode = async (data) => {
    setSavingEpisode(true);
    setError('');
    try {
      const episode = await ingestEpisode(data);
      await loadEpisodes();
      setSelectedEpisodeId(episode.id);
      setShowAddEpisode(false);
    } catch (err) {
      setError(err.message || 'Failed to add episode');
    } finally {
      setSavingEpisode(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedEpisodeId) return;
    setAnalyzing(true);
    setError('');
    setFinalPreview(null);
    try {
      const result = await validateEpisode(selectedEpisodeId);
      setIssues(result);
      setAnalysisCompleted(true);
    } catch (err) {
      setError(err.message || 'Failed to analyze episode');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePatchDecision = async (issueId, action, variantId = null) => {
    setDecisionLoadingId(issueId);
    setError('');
    try {
      const decision = await recordPatchDecision(issueId, action, variantId);
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? { ...issue, patch_decision: decision } : issue
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to record patch decision');
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const handleGenerateFinal = async () => {
    if (!selectedEpisodeId) return;
    setFinalLoading(true);
    setError('');
    try {
      const result = await generateFinalVersion(selectedEpisodeId);
      setIssues(result.issues);
      setFinalPreview({ episodeId: selectedEpisodeId, ...result });
    } catch (err) {
      setError(err.message || 'Failed to generate final story version');
    } finally {
      setFinalLoading(false);
    }
  };

  return (
    <div className="page-shell space-y-6">
      <section className="hero-canvas">
        <div className="relative z-10 p-5 md:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="space-y-4">
              <div className="hero-kicker mono">
                <Sparkles size={14} className="text-verse-red" />
                <strong>PocketVerse Dashboard</strong>
                <span>story analysis to final episode</span>
              </div>
              <div className="space-y-3">
                <h1 className="page-title">Analyze your story. Fix continuity. See the final version.</h1>
                <p className="page-subtitle">
                  Add real episode text, select the episode, run validation, accept rewrite fixes,
                  then generate the cleaned final episode text.
                </p>
              </div>
            </div>
            <button onClick={() => setShowAddEpisode(true)} className="btn-primary shrink-0">
              <Plus size={16} />
              Add Episode
            </button>
          </div>

          <div className="stat-grid">
            {[
              { label: 'Episodes', value: stats.episodes, icon: BookOpen, color: 'text-verse-text' },
              { label: 'Current Issues', value: stats.issues, icon: ShieldCheck, color: 'text-verse-amber' },
              { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-verse-red' },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-verse-green' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="stat-card">
                <div className="flex items-center justify-between gap-3">
                  <p>{label}</p>
                  <Icon size={16} className={color} />
                </div>
                <strong className={color}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="glass-panel p-4 border-verse-red/30 text-verse-red text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <LoadingState type="skeleton" />
      ) : episodes.length === 0 && !showAddEpisode ? (
        <EmptyState onAdd={() => setShowAddEpisode(true)} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
          <aside className="space-y-5">
            <section className="glass-panel p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="heading-md text-verse-text">Current Story</h2>
                  <p className="text-sm text-verse-text-muted">
                    One serialized story memory graph, ordered by episode.
                  </p>
                </div>
                <button onClick={loadEpisodes} className="btn-secondary !p-2" title="Refresh">
                  <RefreshCw size={15} />
                </button>
              </div>

              <div className="space-y-2">
                {episodes.map((episode) => (
                  <button
                    key={episode.id}
                    onClick={() => setSelectedEpisodeId(episode.id)}
                    className={`
                      w-full text-left input-shell p-3 flex items-center gap-3 transition-all
                      ${selectedEpisodeId === episode.id ? 'border-verse-red/50 shadow-[0_0_18px_rgba(232,32,63,0.12)]' : ''}
                    `}
                  >
                    <div className="w-10 h-10 rounded-xl bg-verse-red-dim border border-verse-red/20 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-verse-red" />
                    </div>
                    <div className="min-w-0">
                      <p className="mono text-xs text-verse-red">EP{episode.number}</p>
                      <p className="text-sm text-verse-text font-semibold truncate">{episode.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {showAddEpisode && (
              <section className="command-panel">
                <div className="relative z-10 p-4 space-y-4">
                  <div>
                    <h2 className="heading-md text-verse-text">Add Episode</h2>
                    <p className="text-sm text-verse-text-muted">
                      Text only: episode number, title, and body.
                    </p>
                  </div>
                  <UploadZone
                    onSubmit={handleAddEpisode}
                    loading={savingEpisode}
                    defaultEpisodeNumber={nextEpisodeNumber}
                    serverError={error}
                  />
                </div>
              </section>
            )}
          </aside>

          <main className="space-y-5">
            {episodeLoading ? (
              <LoadingState type="skeleton" />
            ) : selectedEpisode ? (
              <>
                <section className="glass-panel p-4 md:p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <p className="mono text-xs text-verse-red mb-2">EP{selectedEpisode.number}</p>
                      <h2 className="heading-lg text-verse-text">{selectedEpisode.title}</h2>
                      <p className="text-sm text-verse-text-muted mt-1">
                        Select this episode, run analysis, then generate the final story version after fixes.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary">
                        {analyzing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                        {analyzing ? 'Analyzing...' : analysisCompleted ? 'Re-run Analysis' : 'Analyze Episode'}
                      </button>
                      <button
                        onClick={handleGenerateFinal}
                        disabled={!canGenerateFinal || finalLoading}
                        className="btn-secondary"
                        title={!canGenerateFinal ? 'Accept at least one rewrite variant first to generate a final version' : 'Generate final cleaned episode version'}
                      >
                        {finalLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Generate Final Story
                      </button>
                    </div>
                  </div>

                  <pre className="max-h-[280px] overflow-auto whitespace-pre-wrap rounded-xl bg-verse-black/70 border border-verse-border p-4 text-sm leading-relaxed text-verse-text-secondary">
                    {selectedEpisode.raw_text}
                  </pre>
                </section>

                <FinalPreview preview={finalPreview} />

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="heading-md text-verse-text">Analysis Report</h2>
                      <p className="text-sm text-verse-text-muted">
                        Issues and rewrite variants for the selected episode only.
                      </p>
                    </div>
                    <span className="mono text-xs text-verse-text-muted">
                      {issues.length} issues
                    </span>
                  </div>

                  {issues.length === 0 ? (
                    <div className="glass-panel p-8 text-center space-y-3">
                      <CheckCircle2 size={36} className="text-verse-green mx-auto" />
                      <p className="text-verse-text font-semibold">
                        {analysisCompleted
                          ? 'Analysis completed. No continuity issues found.'
                          : 'No issues loaded for this episode.'}
                      </p>
                      <p className="text-sm text-verse-text-muted">
                        {analysisCompleted
                          ? 'The current episode matches the persisted story memory checks.'
                          : 'Run analysis to validate continuity against the story memory graph.'}
                      </p>
                    </div>
                  ) : (
                    issues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onPatchDecision={handlePatchDecision}
                        decisionLoading={decisionLoadingId === issue.id}
                      />
                    ))
                  )}
                </section>
              </>
            ) : (
              <EmptyState onAdd={() => setShowAddEpisode(true)} />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
