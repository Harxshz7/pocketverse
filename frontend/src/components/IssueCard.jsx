import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Wrench,
  XCircle,
  Zap,
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

export default function IssueCard({
  issue,
  onPatchDecision,
  decisionLoading = false,
}) {
  const [expanded, setExpanded] = useState(false);

  const category = CATEGORY_LABELS[issue.category] || {
    label: issue.category,
    icon: Zap,
  };
  const CategoryIcon = category.icon;
  const resolved = issue.resolved;
  const displayStatus = resolved ? 'resolved' : issue.status;
  const variants = issue.rewrite_variants || [];
  const selectedDecision = issue.patch_decision;
  const isRewriteEligible = ['critical', 'needs_review'].includes(issue.status);

  return (
    <div
      className={`
        card issue-card-premium overflow-hidden transition-all duration-500
        ${resolved ? 'border-verse-green/30 shadow-[0_0_20px_rgba(45,212,160,0.1)]' : ''}
        ${!resolved && issue.status === 'critical' ? 'border-verse-red/30' : ''}
        animate-fade-in
      `}
      style={{ animationDelay: '0.05s' }}
    >
      <div
        className="flex items-start gap-4 p-5 cursor-pointer select-none hover:bg-verse-surface-hover/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        aria-expanded={expanded}
      >
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

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={displayStatus} />
            <span className="text-verse-text-muted text-xs mono uppercase tracking-wider">
              {category.label}
            </span>
            {issue.persona_tag && (
              <>
                <span className="text-verse-text-muted/50">•</span>
                <span className="text-verse-red/80 text-xs mono uppercase tracking-wider">
                  {issue.persona_tag}
                </span>
              </>
            )}
            <span className="text-verse-text-muted/50">•</span>
            <span className="text-verse-text-muted text-xs mono uppercase tracking-wider">
              {issue.evidence.length} evidence
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

        <div className="text-verse-text-muted mt-1 shrink-0">
          {expanded
            ? <ChevronUp size={18} />
            : <ChevronDown size={18} />
          }
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-verse-border/40 pt-4 animate-fade-in">
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

          <div className="space-y-2">
            <h4 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono">
              Reasoning
            </h4>
            <p className="text-sm text-verse-text-secondary leading-relaxed">
              {issue.reasoning}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono">
              Impact
            </h4>
            <p className="text-sm text-verse-text-secondary leading-relaxed">
              {issue.impact}
            </p>
          </div>

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

          {!resolved && isRewriteEligible && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono flex items-center gap-2">
                <Wrench size={12} />
                Rewrite Variants
              </h4>
              {variants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {variants.map((variant) => {
                    const selected = selectedDecision?.variant_db_id === variant.id;
                    return (
                      <div
                        key={variant.id}
                        className={`
                          glass-panel p-4 space-y-3
                          ${selected ? 'border-verse-green/40 shadow-[0_0_18px_rgba(45,212,160,0.12)]' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs mono text-verse-red uppercase tracking-wider">
                            {variant.variant_id} / {variant.tone_label}
                          </span>
                          {selected && (
                            <span className="text-xs text-verse-green mono flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              Accepted
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-verse-text leading-relaxed">
                          {variant.rewritten_text}
                        </p>
                        <p className="text-xs text-verse-text-muted leading-relaxed">
                          {variant.rationale}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPatchDecision?.(issue.id, 'accept_variant', variant.variant_id);
                          }}
                          disabled={decisionLoading || selected}
                          className="btn-secondary !py-2 !px-3 text-xs"
                        >
                          <CheckCircle2 size={13} />
                          Accept {variant.variant_id}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-verse-text-muted">
                  No exact quoted span from this episode was available for safe patching.
                </p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPatchDecision?.(issue.id, 'keep_original');
                  }}
                  disabled={decisionLoading || selectedDecision?.action === 'keep_original'}
                  className="btn-secondary !py-2 !px-3 text-xs"
                >
                  <XCircle size={13} />
                  Keep Original
                </button>
              </div>
            </div>
          )}

          {selectedDecision?.action === 'keep_original' && (
            <div className="space-y-2 p-3 bg-verse-black/40 border border-verse-border rounded-lg">
              <h4 className="text-xs font-bold tracking-wider text-verse-text-muted uppercase mono flex items-center gap-2">
                <XCircle size={12} />
                Patch Decision
              </h4>
              <p className="text-sm text-verse-text-muted">
                Original wording kept. This issue will not contribute a patch to the final version.
              </p>
            </div>
          )}

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
        </div>
      )}
    </div>
  );
}
