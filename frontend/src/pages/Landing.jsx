import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  FileText,
  GitBranch,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import CinematicScene from '../components/CinematicScene';

const HERO_METRICS = [
  { value: '01', label: 'LLM extraction pass' },
  { value: '05', label: 'deterministic validators' },
  { value: '100%', label: 'evidence-first review' },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'Story Memory Graph',
    copy: 'Characters, traits, relationships, secrets, promises, world rules, and timeline events are stored as structured memory instead of loose summaries.',
  },
  {
    icon: ShieldCheck,
    title: 'Deterministic Validation',
    copy: 'The engine flags continuity risks with repeatable logic first, then uses the LLM only to explain what the rules already found.',
  },
  {
    icon: RadioTower,
    title: 'Audio-Series Workflow',
    copy: 'Designed for serialized Pocket FM style storytelling where small contradictions can break listener trust across dozens of episodes.',
  },
];

const WORKFLOW = [
  { step: '01', title: 'Ingest', desc: 'Drop episode text into the extraction dock.' },
  { step: '02', title: 'Structure', desc: 'Convert raw scenes into graph-backed memory.' },
  { step: '03', title: 'Validate', desc: 'Run continuity checks against prior canon.' },
  { step: '04', title: 'Resolve', desc: 'Review evidence and fix with confidence.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page-shell space-y-6">
      <section className="hero-canvas">
        <div className="hero-grid">
          <div className="relative z-10 space-y-8 animate-fade-in">
            <div className="hero-kicker mono">
              <Sparkles size={14} className="text-verse-red" />
              <strong>Pocket FM x OpenAI</strong>
              <span>Zero to One Hackathon Build</span>
            </div>

            <div className="space-y-6">
              <h1 className="hero-title text-verse-text">
                Catch story bugs before listeners do.
                <span className="hero-title-mark"> Ship cleaner canon.</span>
              </h1>
              <p className="hero-copy">
                PocketVerse is an AI creator copilot for serialized audio drama. It extracts
                narrative memory, validates continuity with deterministic rules, and returns
                evidence-backed fixes creators can act on immediately.
              </p>
            </div>

            <div className="hero-actions">
              <button
                onClick={() => navigate('/upload')}
                className="btn-primary text-base px-8 py-3"
              >
                Start Episode Scan
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/review')}
                className="btn-secondary text-base px-8 py-3"
              >
                View Validation Demo
              </button>
            </div>

            <div className="hero-metric-grid">
              {HERO_METRICS.map(({ value, label }) => (
                <div key={label} className="metric-card">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <CinematicScene variant="home" />
        </div>
      </section>

      <section className="section-shell">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="mono text-xs tracking-[0.24em] uppercase text-verse-red mb-2">
              Built for creators under deadline
            </p>
            <h2 className="heading-lg text-verse-text">Production-grade story intelligence</h2>
          </div>
          <p className="text-sm text-verse-text-muted max-w-lg">
            The UI keeps the hackathon narrative honest: LLMs extract and explain,
            the validation engine decides.
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="feature-card">
              <div className="feature-card-icon">
                <Icon size={24} />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="flex items-center gap-3 mb-5">
          <div className="feature-card-icon !w-10 !h-10 !rounded-xl">
            <GitBranch size={20} />
          </div>
          <div>
            <p className="mono text-xs tracking-[0.22em] uppercase text-verse-text-muted">
              Pipeline
            </p>
            <h2 className="heading-md text-verse-text">From raw episode to fixable issue</h2>
          </div>
        </div>

        <div className="workflow-grid">
          {WORKFLOW.map(({ step, title, desc }) => (
            <article key={step} className="workflow-card">
              <strong>{step}</strong>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5 justify-between">
        <div className="flex items-start gap-4">
          <div className="feature-card-icon !w-12 !h-12">
            <Zap size={22} />
          </div>
          <div>
            <h2 className="heading-md text-verse-text">Evidence is the product promise.</h2>
            <p className="text-sm text-verse-text-muted mt-1 max-w-2xl leading-relaxed">
              Every issue card points back to episode evidence, reasoning, impact, and
              creator-ready fixes. No vague hallucinated notes.
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/memory')} className="btn-secondary shrink-0">
          <FileText size={16} />
          Inspect Story Memory
        </button>
      </section>
    </div>
  );
}
