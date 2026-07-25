import {
  Users,
  GitBranch,
  Clock,
  Globe,
  Sparkles,
  Lock,
  Zap,
} from 'lucide-react';

const TURNING_POINT_COLORS = {
  BETRAYAL: 'text-verse-red',
  DEATH: 'text-verse-red',
  REDEMPTION: 'text-verse-green',
  TRAUMA: 'text-verse-amber',
  REVELATION: 'text-verse-amber',
  POWER_GAIN: 'text-verse-green',
  POWER_LOSS: 'text-verse-red',
  MOTIVATION_SHIFT: 'text-verse-amber',
  FEAR_OVERCOME: 'text-verse-green',
  ALLIANCE_FORMED: 'text-verse-green',
  ALLIANCE_BROKEN: 'text-verse-red',
  SECRET_REVEALED: 'text-verse-amber',
  PROMISE_MADE: 'text-verse-amber',
  PROMISE_BROKEN: 'text-verse-red',
};

function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="p-1.5 rounded-md bg-verse-red-dim">
        <Icon size={14} className="text-verse-red" />
      </div>
      <h3 className="heading-md text-verse-text">{title}</h3>
      {count !== undefined && (
        <span className="ml-auto text-xs mono text-verse-text-muted bg-verse-black px-2 py-0.5 rounded-full border border-verse-border">
          {count}
        </span>
      )}
    </div>
  );
}

function CharacterCard({ character }) {
  return (
    <div className="card p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-verse-text">{character.name}</h4>
        <span className="text-xs mono text-verse-text-muted">
          EP{character.first_appearance_episode}
        </span>
      </div>
      {character.traits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {character.traits.map((trait, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-verse-black border border-verse-border text-verse-text-secondary"
            >
              {trait}
            </span>
          ))}
        </div>
      )}
      {character.motivations.length > 0 && (
        <p className="text-xs text-verse-text-muted leading-relaxed">
          <span className="text-verse-amber">⟩</span> {character.motivations.join(' · ')}
        </p>
      )}
    </div>
  );
}

function TimelineItem({ event }) {
  const color = event.turning_point_type
    ? TURNING_POINT_COLORS[event.turning_point_type] || 'text-verse-amber'
    : 'text-verse-text-muted';

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className={`
          w-2.5 h-2.5 rounded-full mt-1.5 shrink-0
          ${event.turning_point_type
            ? 'bg-verse-red shadow-[0_0_8px_rgba(232,32,63,0.4)]'
            : 'bg-verse-border group-hover:bg-verse-text-muted'
          }
          transition-colors
        `} />
        <div className="w-px flex-1 bg-verse-border/50" />
      </div>
      <div className="pb-4 space-y-1">
        <p className="text-sm text-verse-text leading-relaxed">
          {event.event_description}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs mono text-verse-text-muted">
            #{String(event.sequence_order).padStart(2, '0')}
          </span>
          {event.turning_point_type && (
            <span className={`text-xs mono font-bold tracking-wider ${color}`}>
              ⟨{event.turning_point_type.replace(/_/g, ' ')}⟩
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GraphPanel({ storyMemory }) {
  if (!storyMemory) return null;

  const {
    characters = [],
    relationships = [],
    timeline_events = [],
    world_rules = [],
    promises = [],
    secrets = [],
  } = storyMemory;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Characters */}
      <section>
        <SectionHeader icon={Users} title="Characters" count={characters.length} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section>
        <SectionHeader icon={Clock} title="Timeline" count={timeline_events.length} />
        <div className="card p-5">
          {timeline_events.map((e) => (
            <TimelineItem key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* Relationships */}
      <section>
        <SectionHeader icon={GitBranch} title="Relationships" count={relationships.length} />
        <div className="space-y-2">
          {relationships.map((r) => (
            <div key={r.id} className="card p-4 flex items-center gap-3">
              <span className="text-verse-text font-medium text-sm">{r.character_a_name}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-verse-red-dim text-verse-red text-xs mono font-bold">
                {r.type}
              </span>
              <span className="text-verse-text font-medium text-sm">{r.character_b_name}</span>
              <span className="ml-auto text-xs text-verse-text-muted hidden md:block">
                {r.description}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* World Rules */}
      {world_rules.length > 0 && (
        <section>
          <SectionHeader icon={Globe} title="World Rules" count={world_rules.length} />
          <div className="space-y-2">
            {world_rules.map((r) => (
              <div key={r.id} className="card p-4 flex items-start gap-3">
                <Zap size={14} className="text-verse-amber mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-verse-text">{r.rule}</p>
                  <span className="text-xs mono text-verse-text-muted mt-1 inline-block">
                    {r.category} · EP{r.established_episode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Promises & Secrets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promises.length > 0 && (
          <section>
            <SectionHeader icon={Sparkles} title="Promises" count={promises.length} />
            <div className="space-y-2">
              {promises.map((p) => (
                <div key={p.id} className="card p-4 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${p.fulfilled ? 'bg-verse-green' : 'bg-verse-amber animate-pulse-glow'}`} />
                  <div>
                    <p className={`text-sm ${p.fulfilled ? 'text-verse-text-muted line-through' : 'text-verse-text'}`}>
                      {p.description}
                    </p>
                    <span className="text-xs mono text-verse-text-muted">
                      EP{p.made_episode}
                      {p.fulfilled && p.fulfilled_episode && ` → EP${p.fulfilled_episode}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {secrets.length > 0 && (
          <section>
            <SectionHeader icon={Lock} title="Secrets" count={secrets.length} />
            <div className="space-y-2">
              {secrets.map((s) => (
                <div key={s.id} className="card p-4 flex items-start gap-3">
                  <Lock size={14} className={`mt-0.5 shrink-0 ${s.revealed ? 'text-verse-text-muted' : 'text-verse-red'}`} />
                  <div>
                    <p className={`text-sm ${s.revealed ? 'text-verse-text-muted' : 'text-verse-text'}`}>
                      {s.description}
                    </p>
                    <span className="text-xs mono text-verse-text-muted">
                      EP{s.established_episode}
                      {s.revealed && s.revealed_episode && ` · revealed EP${s.revealed_episode}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
