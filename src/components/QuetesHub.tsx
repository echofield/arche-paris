/**
 * ARCHÉ — Quêtes hub (Méridiens, Lieux, extensible).
 */

import { BackButton } from './BackButton';
import { useTranslation } from '../utils/i18n';

interface QuetesHubProps {
  onBack: () => void;
  onEnterMeridiens: () => void;
  onEnterLieux: () => void;
  onEnterMarches: () => void;
}

const SERIF = 'var(--font-serif)';
const SANS = 'var(--font-sans)';

export function QuetesHub({ onBack, onEnterMeridiens, onEnterLieux, onEnterMarches }: QuetesHubProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 48px)',
        boxSizing: 'border-box',
      }}
    >
      <BackButton onClick={onBack} />
      <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 6vw, 36px)', color: '#1A1A1A', marginBottom: 8 }}>
        {t('quetes.hubTitle')}
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 14, color: '#003D2C', opacity: 0.7, marginBottom: 32 }}>
        {t('quetes.hubSubtitle')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          type="button"
          onClick={onEnterMeridiens}
          style={{
            fontFamily: SERIF,
            fontSize: 18,
            padding: '20px 24px',
            background: 'transparent',
            border: '1px solid rgba(0,61,44,0.25)',
            borderRadius: 4,
            color: '#003D2C',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {t('quetes.meridiens')}
        </button>
        <button
          type="button"
          onClick={onEnterLieux}
          style={{
            fontFamily: SERIF,
            fontSize: 18,
            padding: '20px 24px',
            background: 'transparent',
            border: '1px solid rgba(0,61,44,0.25)',
            borderRadius: 4,
            color: '#003D2C',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          Lieux
        </button>
        <button
          type="button"
          onClick={onEnterMarches}
          style={{
            fontFamily: SERIF,
            fontSize: 18,
            padding: '20px 24px',
            background: 'transparent',
            border: '1px solid rgba(0,61,44,0.25)',
            borderRadius: 4,
            color: '#003D2C',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {t('quetes.marches')}
        </button>
      </div>
    </div>
  );
}
