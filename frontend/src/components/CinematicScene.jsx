import {
  AudioWaveform,
  BrainCircuit,
  GitBranch,
  Radar,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import heroSlab from '../assets/hero.png';

const SCENE_CONFIG = {
  home: {
    icon: Radar,
    eyebrow: 'Story radar',
    title: 'Memory core',
    signal: 'continuity lock',
  },
  upload: {
    icon: UploadCloud,
    eyebrow: 'Episode intake',
    title: 'Extraction dock',
    signal: 'graph build',
  },
  memory: {
    icon: BrainCircuit,
    eyebrow: 'Graph lens',
    title: 'Story memory',
    signal: 'entity sync',
  },
  review: {
    icon: ShieldCheck,
    eyebrow: 'Validation bay',
    title: 'Issue scanner',
    signal: 'evidence ready',
  },
};

const MINI_MODELS = [
  { label: 'Characters', value: 'traits', icon: BrainCircuit, className: 'scene-node-a' },
  { label: 'Timeline', value: 'events', icon: AudioWaveform, className: 'scene-node-b' },
  { label: 'Rules', value: 'logic', icon: ShieldCheck, className: 'scene-node-c' },
  { label: 'Promises', value: 'payoff', icon: GitBranch, className: 'scene-node-d' },
];

export default function CinematicScene({ variant = 'home', compact = false }) {
  const config = SCENE_CONFIG[variant] || SCENE_CONFIG.home;
  const MainIcon = config.icon;

  return (
    <div
      className={`cinematic-scene cinematic-scene-${variant} ${compact ? 'cinematic-scene-compact' : ''}`}
      aria-hidden="true"
    >
      <div className="scene-halo scene-halo-one" />
      <div className="scene-halo scene-halo-two" />
      <div className="scene-perspective">
        <div className="scene-grid-plane" />
        <div className="scene-orbit scene-orbit-one" />
        <div className="scene-orbit scene-orbit-two" />

        <div className="scene-core-stack">
          <img src={heroSlab} alt="" className="scene-slab scene-slab-top" />
          <div className="scene-core-orb">
            <div className="scene-core-orb-inner">
              <MainIcon size={compact ? 26 : 34} />
            </div>
          </div>
          <img src={heroSlab} alt="" className="scene-slab scene-slab-bottom" />
        </div>

        <div className="scene-title-card">
          <span>{config.eyebrow}</span>
          <strong>{config.title}</strong>
          <small>{config.signal}</small>
        </div>

        {MINI_MODELS.map(({ label, value, icon: Icon, className }) => (
          <div key={label} className={`scene-node ${className}`}>
            <Icon size={14} />
            <span>{label}</span>
            <small>{value}</small>
          </div>
        ))}

        <div className="scene-wave">
          {[...Array(12)].map((_, index) => (
            <span
              key={index}
              style={{
                '--wave-index': index,
                '--wave-height': `${0.8 + (index % 5) * 0.38}rem`,
              }}
            />
          ))}
        </div>

        <div className="scene-spark scene-spark-one">
          <Sparkles size={16} />
        </div>
        <div className="scene-spark scene-spark-two">
          <Sparkles size={12} />
        </div>
      </div>
    </div>
  );
}
