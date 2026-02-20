import { useEffect, useMemo, useRef } from 'react';
import { motion } from '../design/motion';

type OracleMode = 'seek' | 'scan' | 'archive' | 'ritual';

const modeColors: Record<OracleMode, string> = {
  seek: '#0E3F2F',
  scan: '#2d7a5f',
  archive: '#C9A961',
  ritual: '#8B4513',
};

interface OracleMessageFlowProps {
  visible: boolean;
  mode: OracleMode;
  line1: string;
  line2?: string | null;
  echoHint?: string | null;
  step: 0 | 1 | 2;
  onAdvance: () => void;
  onClose: () => void;
}

export function OracleMessageFlow({
  visible,
  mode,
  line1,
  line2,
  echoHint,
  step,
  onAdvance,
  onClose,
}: OracleMessageFlowProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const color = modeColors[mode];
  const reducedMotion = motion.prefersReducedMotion();
  const layered = motion.stagger(5, 'layeredEntrance');
  const appearMs = reducedMotion ? motion.reducedMs() : motion.t('measured');
  const dismissMs = reducedMotion ? motion.reducedMs() : Math.round(appearMs * 1.5);
  const pulseMs = reducedMotion ? motion.reducedMs() : motion.t('contemplative');

  useEffect(() => {
    if (!visible) return;
    dialogRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, onClose]);

  const displayText = useMemo(() => {
    if (step === 0) return line1;
    if (step === 1 && line2) return `${line1}\n\n${line2}`;
    if (step === 2 && echoHint) return `${line1}${line2 ? `\n\n${line2}` : ''}\n\nÉcho: ${echoHint}`;
    return `${line1}${line2 ? `\n\n${line2}` : ''}`;
  }, [line1, line2, echoHint, step]);

  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 96,
        background: 'rgba(250,248,242,0.42)',
        animation: `oracle-fade-in ${appearMs}ms ${motion.ease('appear')}`,
      }}
    >
      <style>{`
        @keyframes oracle-fade-in {
          0% { opacity: ${motion.transforms.appear.from.opacity}; transform: ${motion.transforms.appear.from.transform}; }
          100% { opacity: ${motion.transforms.appear.to.opacity}; transform: ${motion.transforms.appear.to.transform}; }
        }
        @keyframes oracle-fade-out {
          0% { opacity: ${motion.transforms.dismiss.from.opacity}; transform: ${motion.transforms.dismiss.from.transform}; }
          100% { opacity: ${motion.transforms.dismiss.to.opacity}; transform: ${motion.transforms.dismiss.to.transform}; }
        }
        @keyframes oracle-rot {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes oracle-bar {
          0%,100% { height: 8px; opacity: 0.22; }
          50% { height: 16px; opacity: 0.35; }
        }
        @media (prefers-reduced-motion: reduce) {
          .oracle-spin,
          .oracle-bars span {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="oracle-spin"
        style={{
          position: 'absolute',
          top: 128,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 300,
          height: 300,
          animation: `oracle-rot ${motion.t('ambient')}ms ${motion.ease('continuous')} infinite`,
          animationDelay: `${layered[0]}ms`,
        }}
      >
        <svg viewBox="0 0 300 300" width="300" height="300">
          {Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const x1 = 150 + Math.cos(angle) * 56;
            const y1 = 150 + Math.sin(angle) * 56;
            const x2 = 150 + Math.cos(angle) * 138;
            const y2 = 150 + Math.sin(angle) * 138;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeOpacity="0.04" strokeWidth="1" />;
          })}
        </svg>
      </div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="oracle-label"
        aria-describedby="oracle-message"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 448,
          width: 'min(90vw, 448px)',
          padding: '24px 48px',
          background: 'rgba(253, 252, 250, 0.96)',
          border: `1px solid ${color}20`,
          cursor: 'pointer',
          pointerEvents: 'auto',
          animation: `oracle-fade-in ${appearMs}ms ${motion.ease('appear')}`,
          animationDelay: `${layered[2]}ms`,
          transition: motion.transition([
            { property: 'opacity', durationMs: dismissMs, easing: motion.ease('dismiss') },
            { property: 'transform', durationMs: dismissMs, easing: motion.ease('dismiss') },
            { property: 'filter', durationMs: dismissMs, easing: motion.ease('dismiss') },
          ]),
          willChange: 'opacity, transform, filter',
        }}
      >
        <p id="oracle-label" style={{ margin: '0 0 16px', fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center', color, opacity: 0.4 }}>
          Oracle
        </p>
        <p id="oracle-message" style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 16, lineHeight: 1.625, textAlign: 'center', color }}>
          {displayText}
        </p>
        <div aria-hidden="true" className="oracle-bars" style={{ marginTop: 16, display: 'flex', gap: 4, justifyContent: 'center' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 3,
                height: 8,
                background: color,
                opacity: 0.3,
                animation: `oracle-bar ${pulseMs}ms ${motion.ease('transition')} infinite`,
                animationDelay: `${motion.stagger(3, 'staggeredPulse')[i]}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdvance();
        }}
        style={{
          marginTop: 12,
          border: 'none',
          background: 'transparent',
          color,
          opacity: 0.25,
          fontFamily: 'monospace',
          fontSize: 7,
          letterSpacing: '0.1em',
          cursor: 'pointer',
        }}
      >
        TAP TO REVEAL / TAP OUTSIDE TO CLOSE
      </button>
    </div>
  );
}

export type { OracleMode };
