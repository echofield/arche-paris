import { MamlukGrid } from './MamlukGrid';
import { ParisMap } from './ParisMap';
import { useTranslation } from '../utils/i18n';

interface HomepageV1Props {
  onEnterQuetes: () => void;
  onEnterOrigine?: () => void;
  onEnterEtudes?: () => void;
  onEnterCarnet?: () => void;
  onEnterHunter?: () => void;
  onEnterCollection?: () => void;
  onEnterSeuil?: () => void;
}

export function HomepageV1({
  onEnterQuetes,
  onEnterEtudes,
  onEnterCarnet,
  onEnterHunter,
  onEnterCollection,
  onEnterSeuil
}: HomepageV1Props) {
  const { t } = useTranslation();

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
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(48px, 10vw, 96px)',
            fontWeight: '400',
            color: '#1A1A1A',
            letterSpacing: '0.15em',
            marginBottom: '8px',
            lineHeight: 1
          }}
        >
          ARCHE
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.5,
            marginBottom: '48px'
          }}
        >
          {t('home.place')}
        </p>

        <div
          style={{
            width: 'clamp(280px, 50vw, 400px)',
            height: 'clamp(200px, 35vw, 300px)',
            opacity: 0.15,
            marginBottom: '32px'
          }}
        >
          <ParisMap breathing={true} onTap={onEnterCollection} />
        </div>

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
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '32px',
          background: 'transparent',
          border: 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.25,
          cursor: 'pointer',
          transition: 'opacity 0.3s ease',
          zIndex: 100
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.5')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.25')}
      >
        {t('home.hunter')}
      </button>
    </div>
  );
}
