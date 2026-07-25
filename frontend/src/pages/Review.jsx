import { useState, useEffect, useCallback } from 'react';
import { Shield, Filter, AlertCircle } from 'lucide-react';
import IssueCard from '../components/IssueCard';
import LoadingState from '../components/LoadingState';
import { getAllIssues } from '../services/api';

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

  const handleResolve = (issueId) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, resolved: true, resolved_evidence: 'Issue addressed by creator.' }
          : i
      )
    );
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-verse-red-dim">
          <Shield size={20} className="text-verse-red" />
        </div>
        <div>
          <h1 className="heading-lg text-verse-text">Validation Review</h1>
          <p className="text-verse-text-muted text-sm mt-0.5">
            Continuity issues flagged by the Story Validation Engine
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Issues', value: stats.total, color: 'text-verse-text' },
          { label: 'Critical', value: stats.critical, color: 'text-verse-red' },
          { label: 'Needs Review', value: stats.needsReview, color: 'text-verse-amber' },
          { label: 'Resolved', value: stats.resolved, color: 'text-verse-green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <p className={`text-2xl font-bold mono ${color}`}>{value}</p>
            <p className="text-xs text-verse-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-verse-text-muted" />
        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all
                ${statusFilter === value
                  ? 'bg-verse-red/15 text-verse-red border border-verse-red/30'
                  : 'text-verse-text-muted hover:text-verse-text border border-verse-border hover:border-verse-border-light'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-verse-border hidden md:block" />
        <div className="flex gap-1.5">
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategoryFilter(value)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all
                ${categoryFilter === value
                  ? 'bg-verse-red/15 text-verse-red border border-verse-red/30'
                  : 'text-verse-text-muted hover:text-verse-text border border-verse-border hover:border-verse-border-light'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState type="skeleton" />
      ) : error ? (
        <div className="card p-8 text-center space-y-3 animate-fade-in">
          <AlertCircle size={32} className="text-verse-red mx-auto" />
          <p className="text-verse-text font-medium">Failed to load issues</p>
          <p className="text-verse-text-muted text-sm">{error}</p>
          <button onClick={fetchIssues} className="btn-secondary text-sm mx-auto">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-3 animate-fade-in">
          <Shield size={40} className="text-verse-green mx-auto opacity-60" />
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
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}
