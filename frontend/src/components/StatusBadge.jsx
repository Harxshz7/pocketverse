import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  critical: {
    label: 'CRITICAL',
    bg: 'bg-verse-red-dim',
    text: 'text-verse-red-glow',
    border: 'border-verse-red/40',
    glow: 'shadow-[0_0_12px_rgba(232,32,63,0.3)]',
    icon: AlertCircle,
  },
  needs_review: {
    label: 'NEEDS REVIEW',
    bg: 'bg-verse-amber-dim',
    text: 'text-verse-amber',
    border: 'border-verse-amber/30',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    icon: AlertTriangle,
  },
  strong: {
    label: 'STRONG',
    bg: 'bg-verse-amber-dim',
    text: 'text-verse-amber',
    border: 'border-verse-amber/30',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    icon: AlertTriangle,
  },
  resolved: {
    label: 'RESOLVED',
    bg: 'bg-verse-green-dim',
    text: 'text-verse-green',
    border: 'border-verse-green/30',
    glow: 'shadow-[0_0_12px_rgba(45,212,160,0.2)]',
    icon: CheckCircle2,
  },
};

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.needs_review;
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1
        ${config.bg} ${config.text} ${config.border} ${config.glow}
        border rounded-[var(--radius-badge)]
        text-xs font-bold tracking-wider mono uppercase
        transition-all duration-300
        ${className}
      `}
    >
      <Icon size={12} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
