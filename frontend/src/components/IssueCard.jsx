import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Zap,
  Target,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import EvidenceCard from './EvidenceCard';

const CATEGORY_LABELS = {
  CHARACTER_CONTRADICTION: { label: 'Character Contradiction', icon: Target },
  TIMELINE_BREAK: { label: 'Timeline Break', icon: Zap },
  BROKEN_PROMISE: { label: 'Broken Promise', icon: Lightbulb },
  WORLD_RULE_VIOLATION: { label: 'World Rule Violation', icon: Zap },
  RELATIONSHIP_INCONSISTENCY: { label: 'Relationship Inconsistency', icon: Target },
};

export default function IssueCard({ issue, onResolve }) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(issue.resolved);

  const category = CATEGORY_LABELS[issue.category] || {
    label: issue.category,
    icon: Zap,
  };
  const CategoryIcon = category.icon;

  const handleResolve = async () => {
    setResolving(true);
    // Trigger the resolve animation
    await new Promise(r => setTimeout(r, 1200));
    setResolved(true);
    setResolving(false);
    if (onResolve) onResolve(issue.id);
  };

  const displayStatus = resolved ? 'resolved' : issue.status;

  return (
    <div
      className={`
        card overflow-hidden transition-all duration-500
        ${resolving ? 'animate-resolve' : ''}
        ${resolved ? 'border-verse-green/30 shadow-[0_0_20px_rgba(45,212,160,0.1)]' : ''}
        ${!resolved && issue.status === 'critical' ? 'border-verse-red/30' : ''}
        animate-fade-in
      `}
      style={{ animationDelay: '0.05s' }}
    >
      {/* Header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer select-none hover:bg-verse-surface-hover/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {/* Category icon */}
        <div className={`
          mt-0.5 p-2 rounded-lg shrink-0
          ${resolved
            ? 'bg-verse-green-dim text-verse-green'
            : issue.status === 'critical'
              ? 'bg-verse-red-dim text-verse-red'
              : 'bg-verse-amber-dim text-verse-amber'
          }
          transition-colors duration-500
        `}>
          {resolved
            ? <CheckCircle2 size={18} />
            : <CategoryIcon size={18} />
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={displayStatus} />
            <span className="text-verse-text-muted text-xs mono uppercase tracking-wider">
              {category.label}
            </span>
          </div>
          <p className={`
            text-sm leading-relaxed
            ${resolved ? 'text-verse-text-muted line-through decoration-verse-green/40' : 'text-verse-text'}
            transition-colors duration-500
          `}>
            {issue.problem}
          </p>
        </div>

        {/* Expand toggle */}
        <div className="text-verse-text-muted mt-1 shrink-0">
          {expanded
            ? <ChevronUp size={18} />
            : <ChevronDown size={18} />
          }
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-verse-border/40 pt-4 animate-fade-in">
          {/* Evidence */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono">
              Evidence
            </h4>
            <div className="space-y-2">
              {issue.evidence.map((ev, i) => (
                <EvidenceCard key={i} evidence={ev} />
              ))}
            </div>
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono">
              Reasoning
            </h4>
            <p className="text-sm text-verse-text-secondary leading-relaxed">
              {issue.reasoning}
            </p>
          </div>

          {/* Impact */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono">
              Impact
            </h4>
            <p className="text-sm text-verse-text-secondary leading-relaxed">
              {issue.impact}
            </p>
          </div>

          {/* Suggested Fixes */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono flex items-center gap-2">
              <Wrench size={12} />
              Suggested Fixes
            </h4>
            <ul className="space-y-2">
              {issue.suggested_fixes.map((fix, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-verse-text-secondary leading-relaxed"
                >
                  <span className="text-verse-red mono text-xs mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {fix}
                </li>
              ))}
            </ul>
          </div>

          {/* Resolved evidence */}
          {resolved && issue.resolved_evidence && (
            <div className="space-y-2 p-3 bg-verse-green-dim/50 border border-verse-green/20 rounded-lg">
              <h4 className="text-xs font-bold tracking-wider text-verse-green uppercase mono flex items-center gap-2">
                <CheckCircle2 size={12} />
                Resolution
              </h4>
              <p className="text-sm text-verse-green/80 leading-relaxed">
                {issue.resolved_evidence}
              </p>
            </div>
          )}

          {/* Resolve button */}
          {!resolved && (
            <div className="flex justify-end pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResolve();
                }}
                disabled={resolving}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                {resolving ? (
                  <>
                    <div className="spinner !w-4 !h-4" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Mark as Resolved
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
