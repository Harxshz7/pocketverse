import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Terminal, Activity, Disc } from 'lucide-react';
import { api } from '../api/client';

interface AgenticTelemetryHudProps {
  jobId: string;
  title: string;
  defaultSubstep?: string;
}

export const AgenticTelemetryHud: React.FC<AgenticTelemetryHudProps> = ({
  jobId,
  title,
  defaultSubstep = 'OpenAI Onyx Voice Engine',
}) => {
  const [stage, setStage] = useState<string>('⚡ Initializing AI Production Engine...');
  const [subStep, setSubStep] = useState<string>(defaultSubstep);
  const [logs, setLogs] = useState<string[]>([]);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;

    const pollTelemetry = async () => {
      try {
        const data = await api.getProgress(jobId);
        if (data) {
          setStage(data.stage || '⚡ Executing Production AI Pipeline...');
          if (data.subStep) setSubStep(data.subStep);
          if (Array.isArray(data.logs) && data.logs.length > 0) {
            setLogs(data.logs);
          }
        }
      } catch (e) {
        // Silently ignore telemetry poll errors
      }
    };

    pollTelemetry();
    interval = setInterval(pollTelemetry, 300);

    return () => {
      clearInterval(interval);
    };
  }, [jobId]);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="panel panel-accent" style={{
      padding: '1.75rem',
      background: 'var(--bg-void)',
      border: '1px solid var(--accent-red-dim)',
      boxShadow: 'var(--shadow-glow)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.25rem',
      margin: '1.25rem 0',
      width: '100%',
    }}>
      {/* ElevenLabs-Style Dual-Ring Rolling Buffer & Equalizer Animation */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Rotating Conic Ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, var(--accent-red), #8B5CF6, #3B82F6, transparent 70%)',
            animation: 'spinConic 1.2s linear infinite',
          }} />
          
          {/* Inner Void Disk */}
          <div style={{
            position: 'absolute',
            inset: '4px',
            borderRadius: '50%',
            background: 'var(--bg-void)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
          }}>
            {/* Animated Audio Equalizer Bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
              <div style={{ width: '3px', height: '14px', background: 'var(--accent-red)', borderRadius: '2px', animation: 'eqBar 0.6s ease-in-out infinite alternate' }} />
              <div style={{ width: '3px', height: '22px', background: '#8B5CF6', borderRadius: '2px', animation: 'eqBar 0.8s ease-in-out infinite alternate 0.15s' }} />
              <div style={{ width: '3px', height: '10px', background: '#3B82F6', borderRadius: '2px', animation: 'eqBar 0.5s ease-in-out infinite alternate 0.3s' }} />
              <div style={{ width: '3px', height: '18px', background: 'var(--accent-red)', borderRadius: '2px', animation: 'eqBar 0.7s ease-in-out infinite alternate 0.45s' }} />
            </div>
          </div>
        </div>

        {/* Stage Status Text */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', gap: '0.4rem' }}>
            <Disc size={16} color="var(--accent-red)" className="spin" />
            {title}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#A78BFA', fontWeight: 600, marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Activity size={13} color="var(--accent-red)" />
            {stage}
          </div>
        </div>

        <span className="badge-pill badge-analyzed" style={{ fontSize: '0.72rem', padding: '0.25rem 0.75rem', background: 'rgba(139, 92, 246, 0.15)', borderColor: '#8B5CF6', color: '#A78BFA' }}>
          <Sparkles size={12} /> {subStep}
        </span>
      </div>

      {/* Real-time Telemetry Terminal Log Container */}
      <div style={{
        width: '100%',
        background: 'rgba(0,0,0,0.75)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem 1.15rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        maxHeight: '130px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }} ref={logTerminalRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-muted)', marginBottom: '0.25rem', fontSize: '0.7rem', fontWeight: 600 }}>
          <Terminal size={12} color="var(--accent-red)" />
          REAL-TIME AGENTIC TELEMETRY STREAM & LOGS
        </div>

        {logs.length > 0 ? (
          logs.map((logLine, idx) => (
            <div key={idx} style={{ color: logLine.includes('✅') ? '#10B981' : logLine.includes('⚡') ? '#A78BFA' : 'var(--ink-primary)', lineHeight: 1.4 }}>
              {logLine}
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            [00:00:00] Initializing production audio agent...
          </div>
        )}
      </div>

      <style>{`
        @keyframes spinConic {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes eqBar {
          0% { height: 6px; opacity: 0.5; }
          100% { height: 22px; opacity: 1; }
        }
      `}</style>
    </div>
  );
};
