/**
 * ARCHÉ — Instrument reading overlay on Mon Paris map.
 * Three states: quiet (marks only), reading (glow), interpretation (poetic line).
 * Uses motion.ts only; no setTimeout. Callbacks drive state transitions via animation complete.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { project } from '../../utils/map-project';
import { motion as motionTokens } from '../../design/motion';
import type { Lieu } from '../../data/lieux-paris';

const VIEWBOX_WIDTH = 2037.566;
const VIEWBOX_HEIGHT = 1615.5;
const MARK_HIT_RADIUS = 18;
const READING_TO_INTERPRETATION_DELAY_S = (motionTokens.t('measured') * 3 + motionTokens.t('contemplative') * 0.3) / 1000;
const INTERPRETATION_DISPLAY_DURATION_S = (motionTokens.t('contemplative') * 7) / 1000;

export type InstrumentState = 'quiet' | 'reading' | 'interpretation';

interface InstrumentReadingLayerProps {
  lieux: Lieu[];
  instrumentState: InstrumentState;
  activeLieu: Lieu | null;
  onLieuTap: (lieu: Lieu) => void;
  onBackgroundTap: () => void;
  onTransitionToInterpretation: () => void;
  onTransitionToQuiet: () => void;
}

export function InstrumentReadingLayer({
  lieux,
  instrumentState,
  activeLieu,
  onLieuTap,
  onBackgroundTap,
  onTransitionToInterpretation,
  onTransitionToQuiet,
}: InstrumentReadingLayerProps) {
  return (
    <>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 11,
          pointerEvents: 'auto',
        }}
        onClick={instrumentState !== 'quiet' ? onBackgroundTap : undefined}
      >
        <defs>
          <radialGradient id="instrument-reading-glow">
            <stop offset="0%" stopColor="#003D2C" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#003D2C" stopOpacity="0" />
          </radialGradient>
        </defs>
        {lieux.map((lieu) => {
          const p = project(lieu.coordinates.lat, lieu.coordinates.lng);
          const isActive = activeLieu?.id === lieu.id;
          return (
            <g key={lieu.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={MARK_HIT_RADIUS}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onLieuTap(lieu);
                }}
                aria-label={lieu.name}
              />
              {isActive && (instrumentState === 'reading' || instrumentState === 'interpretation') && (
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={40}
                  fill="url(#instrument-reading-glow)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: motionTokens.t('measured') / 1000,
                    ease: motionTokens.ease('appear'),
                  }}
                />
              )}
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 4 : 3}
                fill={isActive ? '#003D2C' : 'none'}
                stroke="#003D2C"
                strokeWidth={isActive ? 0 : 0.6}
                animate={{
                  opacity: isActive ? 0.85 : 0.42,
                }}
                transition={{
                  duration: motionTokens.t('measured') / 1000,
                  ease: motionTokens.ease('appear'),
                }}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        })}
      </svg>

      {instrumentState === 'reading' && activeLieu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          transition={{
            delay: READING_TO_INTERPRETATION_DELAY_S,
            duration: 0,
          }}
          onAnimationComplete={onTransitionToInterpretation}
          style={{ position: 'absolute', pointerEvents: 'none', visibility: 'hidden' }}
          aria-hidden
        />
      )}

      <AnimatePresence>
        {instrumentState === 'interpretation' && activeLieu && (
          <motion.div
            key={activeLieu.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{
              duration: motionTokens.t('measured') / 1000,
              ease: motionTokens.ease('appear'),
            }}
            style={{
              position: 'absolute',
              bottom: 48,
              left: 24,
              right: 24,
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 13,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                fontStyle: 'italic',
                fontWeight: 300,
                letterSpacing: '0.02em',
                lineHeight: 1.6,
                color: '#003D2C',
                opacity: 0.6,
              }}
            >
              {activeLieu.poeticLine}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {instrumentState === 'interpretation' && activeLieu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          transition={{
            delay: INTERPRETATION_DISPLAY_DURATION_S,
            duration: 0,
          }}
          onAnimationComplete={onTransitionToQuiet}
          style={{ position: 'absolute', pointerEvents: 'none', visibility: 'hidden' }}
          aria-hidden
        />
      )}
    </>
  );
}
