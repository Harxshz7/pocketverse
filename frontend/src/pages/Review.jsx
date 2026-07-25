import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Filter,
  Shield,
  ShieldAlert,
  Siren,
} from 'lucide-react';
import IssueCard from '../components/IssueCard';
import LoadingState from '../components/LoadingState';
import CinematicScene from '../components/CinematicScene';
import {
  generateFinalVersion,
  getAllIssues,
  recordPatchDecision,
} from '../services/api';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Issues' },
  { value: 'critical', label: 'Critical' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'strong', label: 'Strong' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'CHARACTER_CONTRADICTION', label: 'Character' },
  { value: 'TIMELINE_BREAK', label: 'Timeline' },
  { value: 'BROKEN_PROMISE', label: 'Promise' },
  { value: 'WORLD_RULE_VIOLATION', label: 'World Rule' },
  { value: 'RELATIONSHIP_INCONSISTENCY', label: 'Relationship' },
];

export default function Review() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [decisionLoadingId, setDecisionLoadingId] = useState(null);
  const [finalLoadingEpisodeId, setFinalLoadingEpisodeId] = useState(null);
  const [finalNotice, setFinalNotice] = useState(null);
  const [finalPreview, setFinalPreview] = useState(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllIssues();
      setIssues(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handlePatchDecision = async (issueId, action, variantId = null) => {
    setDecisionLoadingId(issueId);
    setError(null);
    try {
      const decision = await recordPatchDecision(issueId, action, variantId);
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, patch_decision: decision }
            : issue
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to record patch decision');
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const handleGenerateFinalVersion = async (episodeId) => {
    setFinalLoadingEpisodeId(episodeId);
    setFinalNotice(null);
    setError(null);
    try {
      const result = await generateFinalVersion(episodeId, issues);
      setIssues((prev) => [
        ...prev.filter((issue) => issue.episode_id !== episodeId),
        ...result.issues,
      ]);
      setFinalNotice(
        `Episode ${episodeId} final v${result.version.version_number} generated: ${result.resolved_count} resolved, ${result.remaining_count} remaining.`
      );
      setFinalPreview({
        episodeId,
        ...result,
      });
    } catch (err) {
      setError(err.message || 'Failed to generate final version');
    } finally {
      setFinalLoadingEpisodeId(null);
    }
  };

  const filtered = issues.filter((issue) => {
    if (statusFilter !== 'all') {
      if (issue.resolved && statusFilter !== 'resolved') return false;
      if (!issue.resolved && issue.status !== statusFilter) return false;
    }
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
    return true;
  });

  const stats = {
    total: issues.length,
    critical: issues.filter((i) => !i.resolved && i.status === 'critical').length,
    needsReview: issues.filter((i) => !i.resolved && i.status === 'needs_review').length,
    resolved: issues.filter((i) => i.resolved).length,
  };

  const statCards = [
    { label: 'Total Issues', value: stats.total, color: 'text-verse-text', icon: Shield },
    { label: 'Critical', value: stats.critical, color: 'text-verse-red', icon: Siren },
    { label: 'Needs Review', value: stats.needsReview, color: 'text-verse-amber', icon: ShieldAlert },
    { label: 'Resolved', value: stats.resolved, color: 'text-verse-green', icon: CheckCircle2 },
  ];
  const episodesWithAcceptedPatches = [
    ...new Set(
      issues
        .filter((issue) => !issue.resolved && issue.patch_decision?.action === 'accept_variant')
        .map((issue) => issue.episode_id)
    ),
  ];
  const acceptedPatchesForPreview = finalPreview
    ? issues.filter((issue) =>
        issue.episode_id === finalPreview.episodeId
        && issue.patch_decision?.action === 'accept_variant'
        && issue.patch_decision?.original_span
        && issue.patch_decision?.rewritten_text
      )
    : [];

  return (
    <div className="page-shell space-y-6">
      <section className="page-spotlight">
        <div className="relative z-10 space-y-5">
          <div className="hero-kicker mono">
            <Shield size={14} className="text-verse-red" />
            <strong>Validation Review</strong>
            <span>Evidence-backed issue triage</span>
          </div>
          <div className="space-y-3">
            <h1 className="page-title">Continuity risks, ready to fix.</h1>
            <p className="page-subtitle">
              Review findings generated by deterministic validators, with LLM-written
              explanations layered on top for creator-ready action.
            </p>
          </div>
        </div>
        <CinematicScene variant="review" compact />
      </section>

      <section className="stat-grid">
        {statCards.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between gap-3">
              <p>{label}</p>
              <Icon size={16} className={color} />
            </div>
            <strong className={color}>{value}</strong>
          </div>
        ))}
      </section>

      <section className="glass-panel p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Filter size={15} className="text-verse-red" />
          <div>
            <h2 className="heading-md text-verse-text">Signal filters</h2>
            <p className="text-sm text-verse-text-muted">
              Narrow by severity or issue category.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`
                  filter-chip px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${statusFilter === value
                    ? 'filter-chip-active'
                    : 'text-verse-text-muted hover:text-verse-text hover:border-verse-border-light'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-verse-border hidden md:block" />
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCategoryFilter(value)}
                className={`
                  filter-chip px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${categoryFilter === value
                    ? 'filter-chip-active'
                    : 'text-verse-text-muted hover:text-verse-text hover:border-verse-border-light'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-verse-border/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-verse-text">Final version assembly</h3>
            <p className="text-sm text-verse-text-muted">
              Applies only accepted patch spans against the original episode text.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {episodesWithAcceptedPatches.length > 0 ? (
              episodesWithAcceptedPatches.map((episodeId) => (
                <button
                  key={episodeId}
                  onClick={() => handleGenerateFinalVersion(episodeId)}
                  disabled={finalLoadingEpisodeId === episodeId}
                  className="btn-primary !py-2 !px-3 text-xs"
                >
                  {finalLoadingEpisodeId === episodeId && (
                    <div className="spinner !w-3 !h-3 !border-white/30 !border-t-white" />
                  )}
                  Generate Final Version EP{episodeId}
                </button>
              ))
            ) : (
              <button disabled className="btn-secondary !py-2 !px-3 text-xs">
                Accept a variant first
              </button>
            )}
          </div>
        </div>

        {finalNotice && (
          <div className="p-3 rounded-lg bg-verse-green-dim/50 border border-verse-green/20 text-verse-green text-sm">
            {finalNotice}
          </div>
        )}
      </section>

      {finalPreview && (
        <section className="glass-panel p-4 md:p-5 space-y-5 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="feature-card-icon !w-10 !h-10 !rounded-xl">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="heading-md text-verse-text">
                  Final Version Preview / EP{finalPreview.episodeId} v{finalPreview.version.version_number}
                </h2>
                <p className="text-sm text-verse-text-muted mt-1">
                  Before/after view of accepted patches. Original text is preserved separately.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-verse-green-dim border border-verse-green/20 text-verse-green text-xs mono">
                {finalPreview.resolved_count} resolved
              </span>
              <span className="px-3 py-1 rounded-full bg-verse-black border border-verse-border text-verse-text-muted text-xs mono">
                {finalPreview.remaining_count} remaining
              </span>
            </div>
          </div>

          {acceptedPatchesForPreview.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono">
                Accepted Patch Diff
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {acceptedPatchesForPreview.map((issue) => (
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
                      <p className="text-xs text-verse-green uppercase mono">Accepted Rewrite</p>
                      <p className="text-sm text-verse-text leading-relaxed border-l-2 border-verse-green/50 pl-3">
                        {issue.patch_decision.rewritten_text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono">
                Original Episode
              </h3>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-verse-black/70 border border-verse-border p-4 text-sm leading-relaxed text-verse-text-secondary">
                {finalPreview.original_text || 'Original episode text is not available in mock mode.'}
              </pre>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold tracking-wider text-verse-green uppercase mono">
                Final Episode Version
              </h3>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-verse-black/70 border border-verse-green/20 p-4 text-sm leading-relaxed text-verse-text">
                {finalPreview.final_text || 'Final episode text is not available in mock mode.'}
              </pre>
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <LoadingState type="skeleton" />
      ) : error ? (
        <div className="glass-panel p-8 text-center space-y-3 animate-fade-in">
          <AlertCircle size={32} className="text-verse-red mx-auto" />
          <p className="text-verse-text font-medium">Failed to load issues</p>
          <p className="text-verse-text-muted text-sm">{error}</p>
          <button onClick={fetchIssues} className="btn-secondary text-sm mx-auto">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3 animate-fade-in">
          <Shield size={44} className="text-verse-green mx-auto opacity-60" />
          <p className="text-verse-text font-medium text-lg">
            {issues.length === 0 ? 'No issues found' : 'No matching issues'}
          </p>
          <p className="text-verse-text-muted text-sm">
            {issues.length === 0
              ? 'Upload and validate episodes to see continuity checks here.'
              : 'Try adjusting the filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onPatchDecision={handlePatchDecision}
              decisionLoading={decisionLoadingId === issue.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
