/**
 * ARCHÉ — Le Champ
 * Collective, anonymous, fading. Displays Paris map ready for traces.
 *
 * Map extracted from petitsouvenir (CarteInteractive.tsx, MapSection.tsx)
 */

import { BackButton } from './BackButton';
import { ParisFieldMap } from './ParisFieldMap';
import { useTranslation } from '../utils/i18n';

interface ChampScreenProps {
  onBack: () => void;
}

export function ChampScreen({ onBack }: ChampScreenProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        background: 'var(--paper, #FAF8F2)',
        padding: '0 0 80px 0',
      }}
    >
      <BackButton onClick={onBack} />

      {/* Header */}
      <section
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '100px 24px 32px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 400,
            letterSpacing: '0.02em',
            color: 'var(--green, #003D2C)',
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          {t('champ.title')}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
            fontSize: 'clamp(15px, 2.5vw, 17px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'var(--ink, #1A1A1A)',
            opacity: 0.6,
            lineHeight: 1.7,
            maxWidth: 400,
            margin: '0 auto',
          }}
        >
          {t('champ.placeholder')}
        </p>
      </section>

      {/* Paris Map */}
      <section
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '24px 24px 0',
        }}
      >
        <ParisFieldMap items={[]} />
      </section>

      {/* Empty state hint */}
      <section
        style={{
          maxWidth: 400,
          margin: '48px auto 0',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: 'var(--ink, #1A1A1A)',
            opacity: 0.35,
            lineHeight: 1.6,
          }}
        >
          Les traces apparaitront ici.
        </p>
      </section>
    </div>
  );
}
