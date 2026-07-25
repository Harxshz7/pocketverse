import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Brain, Zap, Radar } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-verse-red/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-verse-red/8 blur-[80px] pointer-events-none" />

        <div className="relative text-center max-w-3xl mx-auto space-y-8 animate-fade-in">
          {/* Logo mark */}
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-verse-red to-verse-red-glow flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(232,32,63,0.3)] mb-6">
              <Radar size={40} className="text-white" />
            </div>
            {/* Glow ring */}
            <div className="absolute inset-0 -m-4 rounded-3xl border border-verse-red/10 animate-pulse-glow" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="heading-xl text-verse-text">
              Pocket<span className="text-verse-red text-glow-red">Verse</span>
            </h1>
            <p className="text-xl md:text-2xl text-verse-text-secondary font-light leading-relaxed max-w-xl mx-auto">
              AI Creator Copilot for serialized audio storytelling.
              <br />
              <span className="text-verse-text">
                Catch continuity errors before your audience does.
              </span>
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary text-base px-8 py-3"
            >
              Upload Episodes
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/review')}
              className="btn-secondary text-base px-8 py-3"
            >
              View Demo
            </button>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            {[
              { icon: Brain, label: 'Story Memory Graph', desc: 'Structured understanding' },
              { icon: Shield, label: 'Validation Engine', desc: 'Deterministic checks' },
              { icon: Zap, label: 'Evidence-Backed', desc: 'Cited, not guessed' },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-verse-surface/60 border border-verse-border/50 backdrop-blur-sm"
              >
                <Icon size={18} className="text-verse-red shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-verse-text">{label}</p>
                  <p className="text-xs text-verse-text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 border-t border-verse-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="heading-lg text-center text-verse-text mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Ingest', desc: 'Upload episode text' },
              { step: '02', title: 'Extract', desc: 'Build the memory graph' },
              { step: '03', title: 'Validate', desc: 'Deterministic checks' },
              { step: '04', title: 'Resolve', desc: 'Fix with evidence' },
            ].map(({ step, title, desc }, i) => (
              <div key={step} className="relative group">
                <div className="card p-5 text-center space-y-2 h-full">
                  <span className="mono text-3xl font-bold text-verse-red/40 group-hover:text-verse-red transition-colors">
                    {step}
                  </span>
                  <h3 className="font-semibold text-verse-text">{title}</h3>
                  <p className="text-sm text-verse-text-muted">{desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 text-verse-border z-10">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-verse-border/20 text-center">
        <p className="text-xs text-verse-text-muted">
          PocketVerse — Built for the Pocket FM &ldquo;Zero to One&rdquo; Hackathon
        </p>
      </footer>
    </div>
  );
}
