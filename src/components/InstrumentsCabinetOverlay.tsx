/**
 * ARCHÉ — Instruments Cabinet as overlay panel.
 * Rises from bottom over homepage; first-time usage card; hover/tap usage per instrument.
 * All motion from motion.ts only.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from './BackButton';
import { useTranslation } from '../utils/i18n';
import { motion as motionTokens } from '../design/motion';

const MANUAL_SEEN_KEY = 'arche_instruments_manual_seen';

type InstrumentId = 'meridian' | 'depth' | 'coherence';

interface InstrumentsCabinetOverlayProps {
  onClose: () => void;
  onOpenMeridian: () => void;
}

export function InstrumentsCabinetOverlay({ onClose, onOpenMeridian }: InstrumentsCabinetOverlayProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'silence' | 'panel' | 'rows'>('silence');
  const [hoveredRow, setHoveredRow] = useState<InstrumentId | null>(null);
  const [expandedRow, setExpandedRow] = useState<InstrumentId | null>(null);

  const showManual = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(MANUAL_SEEN_KEY) !== '1';
  }, []);

  const [manualDismissed, setManualDismissed] = useState(false);
  const showManualCard = showManual && !manualDismissed;

  const dismissManual = () => {
    setManualDismissed(true);
    try {
      window.localStorage.setItem(MANUAL_SEEN_KEY, '1');
    } catch {}
  };

  const contemplativeSec = motionTokens.t('contemplative') / 1000;
  const measuredSec = motionTokens.t('measured') / 1000;
  const briskSec = motionTokens.t('brisk') / 1000;
  const briskMs = motionTokens.t('brisk');

  const rowBase = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0, 61, 44, 0.08)',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    color: '#003D2C',
  } as const;

  return (
    <motion.div
      key="instruments-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{
        opacity: { duration: briskSec, ease: motionTokens.ease('transition') },
        exit: { duration: measuredSec, ease: motionTokens.ease('dismiss') },
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'auto',
      }}
    >
      {/* Panel: paper background, then content rises */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: briskSec, ease: motionTokens.ease('transition') }}
        onAnimationComplete={() => setPhase('panel')}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: '75vh',
          maxHeight: '85vh',
          background: 'var(--paper, #FAF8F2)',
          opacity: 0.97,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <BackButton onBack={onClose} label="Retour" />
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: 'clamp(56px, 8vh, 72px)',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'clamp(20px, 4vw, 32px)',
            paddingRight: 'clamp(20px, 4vw, 32px)',
            maxWidth: 560,
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Content: rises after silence */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={phase === 'silence' ? { y: 40, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{
              duration: contemplativeSec,
              ease: motionTokens.ease('transition'),
            }}
            onAnimationComplete={() => {
              if (phase === 'panel') setPhase('rows');
            }}
            style={{ position: 'relative' }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#003D2C',
                opacity: 0.6,
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              {t('instruments.title')}
            </p>

            {/* First-time usage card */}
            <AnimatePresence>
              {showManualCard && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{
                    duration: measuredSec,
                    ease: motionTokens.ease('appear'),
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.6)',
                    borderRadius: 4,
                    padding: '20px 24px',
                    marginBottom: 24,
                    border: '1px solid rgba(0, 61, 44, 0.08)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#003D2C',
                      opacity: 0.7,
                      marginBottom: 12,
                    }}
                  >
                    {t('instruments.manual.title')}
                  </p>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <p
                      key={i}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        color: '#003D2C',
                        opacity: 0.85,
                        marginBottom: i < 5 ? 8 : 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {t(`instruments.manual.line${i}`)}
                    </p>
                  ))}
                  <button
                    type="button"
                    onClick={dismissManual}
                    style={{
                      marginTop: 16,
                      padding: '10px 20px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#003D2C',
                      background: 'transparent',
                      border: '1px solid rgba(0, 61, 44, 0.25)',
                      borderRadius: 2,
                      cursor: 'pointer',
                    }}
                  >
                    {t('instruments.manual.cta')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 4, overflow: 'hidden' }}>
              {/* Meridian row — clickable */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={phase === 'rows' ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{
                  duration: briskSec,
                  delay: 0,
                  ease: motionTokens.ease('transition'),
                }}
              >
                <button
                  type="button"
                  onClick={onOpenMeridian}
                  onMouseEnter={() => setHoveredRow('meridian')}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    ...rowBase,
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{t('instruments.rows.meridian')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: 0.7 }}>
                    <motion.span
                      aria-hidden
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#003D2C' }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{
                        duration: (motionTokens.t('contemplative') * 2) / 1000,
                        repeat: Infinity,
                        ease: motionTokens.ease('transition'),
                      }}
                    />
                    {t('instruments.status.active')}
                  </span>
                </button>
                <UsageReveal
                  visible={hoveredRow === 'meridian' || expandedRow === 'meridian'}
                  text={t('instruments.usage.meridian')}
                  onTap={() => setExpandedRow(expandedRow === 'meridian' ? null : 'meridian')}
                  briskSec={briskSec}
                />
              </motion.div>

              {/* Depth row — disabled */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={phase === 'rows' ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{
                  duration: briskSec,
                  delay: phase === 'rows' ? briskMs / 1000 : 0,
                  ease: motionTokens.ease('transition'),
                }}
              >
                <div
                  style={{ ...rowBase, opacity: 0.5, cursor: 'default' }}
                  onMouseEnter={() => setHoveredRow('depth')}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => setExpandedRow(expandedRow === 'depth' ? null : 'depth')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedRow(expandedRow === 'depth' ? null : 'depth');
                    }
                  }}
                >
                  <span>{t('instruments.rows.depth')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        border: '1px solid #003D2C',
                        background: 'transparent',
                      }}
                      aria-hidden
                    />
                    {t('instruments.status.calibrating')}
                  </span>
                </div>
                <UsageReveal
                  visible={hoveredRow === 'depth' || expandedRow === 'depth'}
                  text={t('instruments.usage.depth')}
                  onTap={() => setExpandedRow(expandedRow === 'depth' ? null : 'depth')}
                  briskSec={briskSec}
                />
              </motion.div>

              {/* Coherence row — disabled */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={phase === 'rows' ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{
                  duration: briskSec,
                  delay: phase === 'rows' ? (briskMs * 2) / 1000 : 0,
                  ease: motionTokens.ease('transition'),
                }}
              >
                <div
                  style={{ ...rowBase, opacity: 0.5, cursor: 'default', borderBottom: 'none' }}
                  onMouseEnter={() => setHoveredRow('coherence')}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => setExpandedRow(expandedRow === 'coherence' ? null : 'coherence')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedRow(expandedRow === 'coherence' ? null : 'coherence');
                    }
                  }}
                >
                  <span>{t('instruments.rows.coherence')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        border: '1px solid #003D2C',
                        background: 'transparent',
                      }}
                      aria-hidden
                    />
                    {t('instruments.status.calibrating')}
                  </span>
                </div>
                <UsageReveal
                  visible={hoveredRow === 'coherence' || expandedRow === 'coherence'}
                  text={t('instruments.usage.coherence')}
                  onTap={() => setExpandedRow(expandedRow === 'coherence' ? null : 'coherence')}
                  briskSec={briskSec}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UsageReveal({
  visible,
  text,
  briskSec,
}: {
  visible: boolean;
  text: string;
  onTap?: () => void;
  briskSec: number;
}) {
  const { ease } = motionTokens;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: briskSec, ease: ease('transition') }}
          style={{
            padding: '8px 20px 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: '#003D2C',
            opacity: 0.8,
            lineHeight: 1.4,
            maxWidth: '100%',
            borderBottom: '1px solid rgba(0, 61, 44, 0.06)',
          }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
