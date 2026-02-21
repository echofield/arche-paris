/**
 * ARCHÉ — Instruments Cabinet: single entry point for perceptual instruments.
 * Exactly 3 rows: Meridian (in service, openable), Depth & Coherence (calibrating, disabled).
 */

import { BackButton } from './BackButton';
import { useTranslation } from '../utils/i18n';

interface InstrumentsCabinetProps {
  onBack: () => void;
  onOpenMeridian: () => void;
}

export function InstrumentsCabinet({ onBack, onOpenMeridian }: InstrumentsCabinetProps) {
  const { t } = useTranslation();

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
    <div
      className="min-h-screen relative flex flex-col"
      style={{ background: 'var(--paper, #FAF8F2)', overflow: 'hidden' }}
    >
      <BackButton onBack={onBack} label="Retour" />
      <div
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(80px, 10vh, 100px)',
          position: 'relative',
          zIndex: 10,
          width: '100%',
        }}
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
        <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 4, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={onOpenMeridian}
            style={{
              ...rowBase,
              width: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              opacity: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 61, 44, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>{t('instruments.meridian')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: 0.7 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#003D2C' }} aria-hidden />
              {t('instruments.status.active')}
            </span>
          </button>
          <div style={{ ...rowBase, opacity: 0.5, cursor: 'default' }}>
            <span>{t('instruments.depth')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid #003D2C', background: 'transparent' }} aria-hidden />
              {t('instruments.status.calibrating')}
            </span>
          </div>
          <div style={{ ...rowBase, opacity: 0.5, cursor: 'default', borderBottom: 'none' }}>
            <span>{t('instruments.coherence')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid #003D2C', background: 'transparent' }} aria-hidden />
              {t('instruments.status.calibrating')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
