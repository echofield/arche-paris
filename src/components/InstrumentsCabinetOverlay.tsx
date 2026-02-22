import { useEffect } from 'react';
import { motion as fm } from 'framer-motion';
import { useTranslation } from '../utils/i18n';
import { motion } from '../design/motion';

interface InstrumentsCabinetOverlayProps {
  onClose: () => void;
  onOpenMeridian: () => void;
  onOpenPlaceScan: () => void;
}

export function InstrumentsCabinetOverlay({ onClose, onOpenMeridian, onOpenPlaceScan }: InstrumentsCabinetOverlayProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <>
      <fm.div
        key="instruments-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: motion.t('brisk') / 1000, ease: motion.ease('transition') }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 14000,
        }}
      />
      <fm.section
        key="instruments-sheet"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: motion.t('measured') / 1000, ease: motion.ease('appear') }}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 14001,
          background: '#FAF8F2',
          borderTop: '1px solid rgba(0, 61, 44, 0.14)',
          boxShadow: '0 -12px 36px rgba(0, 0, 0, 0.14)',
          padding: '24px clamp(18px, 4vw, 40px) calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '24px', letterSpacing: '0.04em', color: '#003D2C' }}>
            {t('instruments.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('instruments.manual.close', 'Fermer')}
            style={{
              border: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              cursor: 'pointer',
            }}
          >
            {t('instruments.manual.close', 'Fermer')}
          </button>
        </div>

        <div style={{ display: 'grid', gap: '8px' }}>
          <button
            type="button"
            onClick={onOpenMeridian}
            style={{
              border: '1px solid rgba(0, 61, 44, 0.18)',
              background: '#F4F1E8',
              color: '#003D2C',
              textAlign: 'left',
              padding: '14px 16px',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {t('instruments.rows.meridian')}
          </button>
          <button
            type="button"
            onClick={onOpenPlaceScan}
            style={{
              border: '1px solid rgba(0, 61, 44, 0.18)',
              background: '#F4F1E8',
              color: '#003D2C',
              textAlign: 'left',
              padding: '14px 16px',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {t('instruments.rows.placeScan')}
          </button>
          <div style={{ border: '1px solid rgba(0, 61, 44, 0.1)', padding: '14px 16px', opacity: 0.58, fontFamily: 'var(--font-sans)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#003D2C' }}>
            {t('instruments.rows.depth')}
          </div>
          <div style={{ border: '1px solid rgba(0, 61, 44, 0.1)', padding: '14px 16px', opacity: 0.58, fontFamily: 'var(--font-sans)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#003D2C' }}>
            {t('instruments.rows.coherence')}
          </div>
        </div>
      </fm.section>
    </>
  );
}
