import { FileText, Quote } from 'lucide-react';

export default function EvidenceCard({ evidence }) {
  return (
    <div className="bg-verse-black/60 border border-verse-border/60 rounded-lg p-4 space-y-3">
      {/* Episode reference */}
      <div className="flex items-center gap-2 text-sm">
        <FileText size={14} className="text-verse-red shrink-0" />
        <span className="text-verse-text-secondary">
          Episode {evidence.episode_number}
        </span>
        <span className="text-verse-text-muted">—</span>
        <span className="text-verse-text-secondary font-medium">
          {evidence.episode_title}
        </span>
      </div>

      {/* Quoted excerpt */}
      <div className="relative pl-4 border-l-2 border-verse-red/40">
        <Quote size={12} className="absolute -left-[7px] -top-0.5 text-verse-red/60 bg-verse-black" />
        <p className="text-verse-text text-sm leading-relaxed italic">
          &ldquo;{evidence.excerpt}&rdquo;
        </p>
      </div>

      {/* Relevance note */}
      <p className="text-verse-text-muted text-xs leading-relaxed pl-4">
        {evidence.relevance}
      </p>
    </div>
  );
}
