import { useEffect } from 'react';
import { MamlukGrid } from './MamlukGrid';
import { useTranslation } from '../utils/i18n';
import { getTodaySummary } from '../utils/walk-service';

interface HomepageV1Props {
  showSilencePrompt?: boolean;
  onSilencePromptShown?: () => void;
  onEnterQuetes: () => void;
  onEnterOrigine?: () => void;
  onEnterEtudes?: () => void;
  onEnterCarnet?: () => void;
  onEnterHunter?: () => void;
  onEnterCollection?: () => void;
  onEnterSeuil?: () => void;
  onEnterMeridiens?: () => void;
}

const MAP_STROKE_OPACITY = 0.165;

export function HomepageV1({
  showSilencePrompt,
  onSilencePromptShown,
  onEnterQuetes,
  onEnterEtudes,
  onEnterCarnet,
  onEnterHunter,
  onEnterCollection,
  onEnterSeuil,
  onEnterMeridiens
}: HomepageV1Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (showSilencePrompt && onSilencePromptShown) onSilencePromptShown();
  }, [showSilencePrompt, onSilencePromptShown]);

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center"
      style={{
        background: '#FAF8F2',
        overflow: 'hidden'
      }}
    >
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />

      <nav
        style={{
          position: 'absolute',
          top: '24px',
          right: '32px',
          display: 'flex',
          gap: '32px',
          zIndex: 100
        }}
      >
        <button
          onClick={onEnterQuetes}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.6,
            cursor: 'pointer',
            transition: 'opacity 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          {t('nav.quests')}
        </button>
        {onEnterMeridiens && (
          <button
            onClick={onEnterMeridiens}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              cursor: 'pointer',
              transition: 'opacity 0.3s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            {t('nav.meridiens')}
          </button>
        )}
        <button
          onClick={onEnterEtudes}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.6,
            cursor: 'pointer',
            transition: 'opacity 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          {t('nav.etudes')}
        </button>
        <button
          onClick={onEnterCarnet}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.6,
            cursor: 'pointer',
            transition: 'opacity 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          {t('nav.notebook')}
        </button>
        <button
          onClick={onEnterCollection}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.6,
            cursor: 'pointer',
            transition: 'opacity 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          {t('nav.map')}
        </button>
        <button
          onClick={onEnterSeuil}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#B8860B',
            opacity: 0.8,
            cursor: 'pointer',
            transition: 'opacity 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
        >
          {t('nav.seuil')}
        </button>
      </nav>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          zIndex: 10
        }}
      >
        {showSilencePrompt && (
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              fontStyle: 'italic',
              color: '#003D2C',
              opacity: 0.85,
              marginBottom: '32px',
              maxWidth: '320px'
            }}
          >
            {t('home.silence')}
          </p>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(48px, 10vw, 96px)',
            fontWeight: '400',
            letterSpacing: '0.15em',
            marginBottom: '8px',
            lineHeight: 1,
            color: '#003D2C'
          }}
        >
          ARCHÉ
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.4,
            marginBottom: '48px'
          }}
        >
          {t('home.place')}
        </p>

        <div
          onClick={onEnterCollection}
          style={{
            width: 'clamp(280px, 50vw, 400px)',
            height: 'clamp(200px, 35vw, 300px)',
            marginBottom: '32px',
            cursor: 'pointer',
            transition: 'opacity 0.3s ease'
          }}
        >
          <img
            src="/Parissvg.svg"
            alt="Paris"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: MAP_STROKE_OPACITY
            }}
          />
        </div>

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: '#003D2C',
            opacity: 0.5,
            marginBottom: '24px'
          }}
        >
          {getTodaySummary().approxKm === 0
            ? `${t('home.walk')} —`
            : `${t('home.walk')} : ~${getTodaySummary().approxKm.toFixed(1)} km`}
        </p>

        <button
          onClick={onEnterCollection}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.5,
            cursor: 'pointer',
            transition: 'opacity 0.3s ease',
            marginBottom: '48px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
        >
          {t('home.invitation')}
        </button>

        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(18px, 3vw, 24px)',
            fontStyle: 'italic',
            color: '#1A1A1A',
            opacity: 0.6,
            lineHeight: 1.5
          }}
        >
          {t('home.sentence')}
        </p>
      </div>

      <button
        onClick={onEnterHunter}
        type="button"
        style={{
          position: 'absolute',
          left: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.35,
          cursor: 'pointer',
          transition: 'opacity 0.3s ease',
          zIndex: 100,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.6')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.35')}
      >
        {t('home.hunter')}
      </button>
    </div>
  );
}
