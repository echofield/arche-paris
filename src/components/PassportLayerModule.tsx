/**
 * ARCHÉ — Passport Layer Module (Fonds / Reliquaire)
 * Shown only when passport.hasPassport && fund.enabled.
 * Snapshot-driven; no local derivation. Follows UI_STABILIZATION_AND_MOBILE_GUIDE + motion.ts.
 */

import { useRef } from 'react';
import type { PassportSnapshot, FundSnapshot, ReliquaireSnapshot } from '../lib/api';
import { motion } from '../design/motion';
import { toast } from 'sonner';

type MonumentPhase = 'reserve' | 'chamber' | 'sanctuary' | 'archive';

/** Single place for fund total display; future-proof for currency + locale. */
export function formatFundTotal(total: number, unit?: string): string {
  if (typeof total !== 'number' || !Number.isFinite(total)) return '—';
  const unitLabel = unit ?? 'unités';
  return `${total} ${unitLabel}`;
}

interface PassportLayerModuleProps {
  passport: PassportSnapshot | null | undefined;
  fund: FundSnapshot | null | undefined;
  reliquaire: ReliquaireSnapshot | null | undefined;
  /** When true, use lower opacity and smaller type (mobile secondary weight). */
  isSecondaryWeight?: boolean;
}

const VALID_PHASES: MonumentPhase[] = ['reserve', 'chamber', 'sanctuary', 'archive'];

function getPhaseKey(reliquaire: ReliquaireSnapshot | null | undefined, fund: FundSnapshot | null | undefined): MonumentPhase {
  const key = reliquaire?.statueKey ?? reliquaire?.phaseKey;
  if (key && VALID_PHASES.includes(key as MonumentPhase)) return key as MonumentPhase;
  const fromFund = fund?.monumentPhase;
  return fromFund && VALID_PHASES.includes(fromFund) ? fromFund : 'reserve';
}

export function PassportLayerModule({ passport, fund, reliquaire, isSecondaryWeight = false }: PassportLayerModuleProps) {
  if (!passport?.hasPassport || !fund?.enabled) return null;

  const resolvedPhase = getPhaseKey(reliquaire, fund);
  const phaseRef = useRef<MonumentPhase>(resolvedPhase);
  if (VALID_PHASES.includes(resolvedPhase) && resolvedPhase !== phaseRef.current) phaseRef.current = resolvedPhase;
  const phase = phaseRef.current;

  const hasData = typeof fund.total === 'number';
  const transitionStyle = {
    transition: motion.appear.transition,
  };

  const containerStyle: React.CSSProperties = {
    padding: isSecondaryWeight ? '16px 20px' : '20px 24px',
    borderRadius: 8,
    maxWidth: 320,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: isSecondaryWeight ? 8 : 12,
    background: isSecondaryWeight ? 'rgba(0, 61, 44, 0.02)' : 'rgba(0, 61, 44, 0.03)',
    border: `1px solid ${isSecondaryWeight ? 'rgba(0, 61, 44, 0.04)' : 'rgba(0, 61, 44, 0.06)'}`,
    ...transitionStyle,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: isSecondaryWeight ? 10 : 12,
    letterSpacing: '0.1em',
    color: '#003D2C',
    opacity: 0.7,
    textTransform: 'uppercase',
    margin: 0,
  };

  const lineStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: isSecondaryWeight ? 11 : 12,
    color: '#003D2C',
    opacity: 0.8,
    lineHeight: 1.4,
    margin: 0,
  };

  return (
    <section
      aria-labelledby="passport-fonds-title"
      style={containerStyle}
    >
      <h2 id="passport-fonds-title" style={titleStyle}>
        Fonds
      </h2>

      {hasData ? (
        <>
          <p style={lineStyle}>
            {formatFundTotal(fund.total)}
          </p>
          {fund.lastAllocation ? (
            <p style={{ ...lineStyle, opacity: 0.6, fontSize: isSecondaryWeight ? 10 : 11 }}>
              Dernière attribution: {fund.lastAllocation.kind} — {fund.lastAllocation.date}
              {fund.lastAllocation.proofId != null && (
                <button
                  type="button"
                  onClick={() => toast('Preuve bientôt disponible')}
                  style={{
                    marginLeft: 8,
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    color: '#003D2C',
                    opacity: 0.8,
                    textDecoration: 'underline',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'inherit',
                    cursor: 'pointer',
                  }}
                  aria-label="Voir la preuve"
                >
                  voir preuve →
                </button>
              )}
            </p>
          ) : null}
        </>
      ) : (
        <p style={lineStyle}>Données indisponibles</p>
      )}

      <ReliquairePlaceholder phase={phase} faint={!hasData} />
    </section>
  );
}

/**
 * Reliquaire phases: each adds one structural element (thin lines only). No glow, no icons.
 * reserve: outer frame only → chamber: + inner rectangle → sanctuary: + central pillar → archive: + 3 sealed notches.
 */
function ReliquairePlaceholder({ phase, faint }: { phase: MonumentPhase; faint: boolean }) {
  const motionMs = motion.t('contemplative');
  const outlineOpacity = faint ? 0.12 : 0.25;
  const size = 48;
  const stroke = 0.5;
  const inset = 8;

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        marginTop: 8,
        opacity: outlineOpacity,
        transition: `opacity ${motionMs}ms ${motion.ease('transition')}`,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        {/* reserve: outer frame only */}
        <rect
          x={stroke / 2}
          y={stroke / 2}
          width={size - stroke}
          height={size - stroke}
          fill="none"
          stroke="#003D2C"
          strokeWidth={stroke}
        />
        {/* chamber: + inner rectangle */}
        {(phase === 'chamber' || phase === 'sanctuary' || phase === 'archive') && (
          <rect
            x={inset}
            y={inset}
            width={size - inset * 2}
            height={size - inset * 2}
            fill="none"
            stroke="#003D2C"
            strokeWidth={stroke}
            opacity={0.7}
          />
        )}
        {/* sanctuary: + central pillar line (vertical) */}
        {(phase === 'sanctuary' || phase === 'archive') && (
          <line
            x1={size / 2}
            y1={inset}
            x2={size / 2}
            y2={size - inset}
            stroke="#003D2C"
            strokeWidth={stroke}
            opacity={0.6}
          />
        )}
        {/* archive: + 3 micro-notches (sealed marks) on bottom edge */}
        {phase === 'archive' && (
          <>
            <line x1={size / 2 - 6} y1={size - inset} x2={size / 2 - 4} y2={size - inset} stroke="#003D2C" strokeWidth={stroke} opacity={0.5} />
            <line x1={size / 2 - 1} y1={size - inset} x2={size / 2 + 1} y2={size - inset} stroke="#003D2C" strokeWidth={stroke} opacity={0.5} />
            <line x1={size / 2 + 4} y1={size - inset} x2={size / 2 + 6} y2={size - inset} stroke="#003D2C" strokeWidth={stroke} opacity={0.5} />
          </>
        )}
      </svg>
    </div>
  );
}
