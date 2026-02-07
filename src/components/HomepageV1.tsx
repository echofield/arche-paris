import { useEffect, useState } from 'react';
import { MamlukGrid } from './MamlukGrid';
import { useTranslation } from '../utils/i18n';
import { getTodaySummary } from '../utils/walk-service';

/** Carte homepage : opacité max pour bien voir les lignes. (Ancienne valeur avant fader : 0.165) */
const MAP_STROKE_OPACITY = 0.5;

interface HomepageV1Props {
  /** When set, show quiet card id (e.g. PS-0001) in identity zone — engraved, no label (optional, for future iPhone) */
  cardId?: string | null;
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
  /** Déconnecter la carte sur cet appareil (pour utiliser la même carte sur un autre, ex. téléphone) */
  onDisconnect?: () => void;
}

export function HomepageV1({
  cardId: _cardId,
  showSilencePrompt,
  onSilencePromptShown,
  onEnterQuetes,
  onEnterEtudes,
  onEnterCarnet,
  onEnterHunter,
  onEnterCollection,
  onEnterSeuil,
  onEnterMeridiens,
  onDisconnect
}: HomepageV1Props) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (showSilencePrompt && onSilencePromptShown) onSilencePromptShown();
  }, [showSilencePrompt, onSilencePromptShown]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = () => setMobileMenuOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [mobileMenuOpen]);

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center"
      style={{
        background: '#FAF8F2',
        overflow: 'hidden'
      }}
    >
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />

      {/* Desktop: single nav row (hidden on phone via CSS) */}
      <nav
        className="homepage-nav-desktop"
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
        {onDisconnect && (
          <button
            onClick={onDisconnect}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6455',
              opacity: 0.5,
              cursor: 'pointer',
              transition: 'opacity 0.3s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
          >
            {t('nav.disconnect')}
          </button>
        )}
      </nav>

      {/* Phone only: hamburger + vertical menu (Explorer / Approfondir) — hidden on desktop via CSS */}
      <div className="homepage-nav-mobile">
        <button
          type="button"
          className="homepage-nav-mobile-toggle"
          onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen); }}
          aria-label="Menu"
          style={{
            position: 'absolute',
            top: 'max(20px, env(safe-area-inset-top, 0px))',
            right: 'max(16px, env(safe-area-inset-right, 0px))',
            zIndex: 101,
            background: 'transparent',
            border: 'none',
            padding: '12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}
        >
          <span style={{ width: '20px', height: '2px', background: '#003D2C', opacity: 0.7 }} />
          <span style={{ width: '20px', height: '2px', background: '#003D2C', opacity: 0.7 }} />
          <span style={{ width: '20px', height: '2px', background: '#003D2C', opacity: 0.7 }} />
        </button>
        {mobileMenuOpen && (
          <div
            className="homepage-nav-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '280px',
              maxWidth: '85vw',
              background: 'var(--paper, #FAF8F2)',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
              zIndex: 200,
              padding: 'max(80px, calc(env(safe-area-inset-top, 0px) + 60px)) 32px 32px',
              paddingRight: 'max(32px, env(safe-area-inset-right, 0px))',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto'
            }}
          >
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'absolute',
                top: 'max(20px, env(safe-area-inset-top, 0px))',
                right: 'max(16px, env(safe-area-inset-right, 0px))',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                color: '#003D2C',
                opacity: 0.5,
                cursor: 'pointer',
                padding: '12px',
                lineHeight: 1
              }}
              aria-label="Fermer"
            >
              ×
            </button>
            <div className="homepage-nav-drawer-block">
              <p className="homepage-nav-drawer-section">{t('home.mobileSectionExplorer', 'Explorer')}</p>
              <button type="button" onClick={() => { onEnterQuetes(); setMobileMenuOpen(false); }} className="homepage-nav-drawer-link">{t('nav.quests')}</button>
              <button type="button" onClick={() => { onEnterCarnet(); setMobileMenuOpen(false); }} className="homepage-nav-drawer-link">{t('nav.notebook')}</button>
              <button type="button" onClick={() => { onEnterCollection(); setMobileMenuOpen(false); }} className="homepage-nav-drawer-link">{t('nav.map')}</button>
            </div>
            <div className="homepage-nav-drawer-block">
              <p className="homepage-nav-drawer-section">{t('home.mobileSectionApprofondir', 'Approfondir')}</p>
              {onEnterMeridiens && <button type="button" onClick={() => { onEnterMeridiens(); setMobileMenuOpen(false); }} className="homepage-nav-drawer-link">{t('nav.meridiens')}</button>}
              <button type="button" onClick={() => { onEnterEtudes(); setMobileMenuOpen(false); }} className="homepage-nav-drawer-link">{t('nav.etudes')}</button>
              <button type="button" onClick={() => { onEnterSeuil(); setMobileMenuOpen(false); }} className="homepage-nav-drawer-link homepage-nav-drawer-link-gold">{t('nav.seuil')}</button>
            </div>
            {onDisconnect && (
              <div className="homepage-nav-drawer-footer">
                <button type="button" onClick={() => { onDisconnect(); setMobileMenuOpen(false); }} className="homepage-nav-drawer-link homepage-nav-drawer-link-muted">{t('nav.disconnect')}</button>
              </div>
            )}
          </div>
        )}
      </div>

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
