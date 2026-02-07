import { useEffect, useState } from 'react';
import { MamlukGrid } from './MamlukGrid';
import { useTranslation } from '../utils/i18n';
import { getTodaySummary } from '../utils/walk-service';

/** Carte homepage : opacité max pour bien voir les lignes. (Ancienne valeur avant fader : 0.165) */
const MAP_STROKE_OPACITY = 0.5;

interface HomepageV1Props {
  /** When set, show quiet card id (e.g. PS-0001) in identity zone — engraved, no label */
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
  cardId,
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

  // Close menu when clicking outside
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
        overflow: 'hidden',
        paddingTop: 'max(24px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(20px, env(safe-area-inset-right, 0px))'
      }}
    >
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />

      {cardId && (
        <div
          style={{
            position: 'absolute',
            left: 'max(20px, env(safe-area-inset-left, 0px))',
            top: 'max(24px, env(safe-area-inset-top, 0px))',
            zIndex: 100,
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.35
          }}
        >
          {cardId}
        </div>
      )}

      {/* Desktop nav - hidden on mobile */}
      <nav
        className="homepage-nav desktop-nav"
        style={{
          position: 'absolute',
          top: 'max(24px, env(safe-area-inset-top, 0px))',
          right: 'max(20px, env(safe-area-inset-right, 0px))',
          display: 'flex',
          gap: '24px',
          zIndex: 100
        }}
      >
        <button onClick={onEnterQuetes} className="nav-link">{t('nav.quests')}</button>
        {onEnterMeridiens && <button onClick={onEnterMeridiens} className="nav-link">{t('nav.meridiens')}</button>}
        <button onClick={onEnterEtudes} className="nav-link">{t('nav.etudes')}</button>
        <button onClick={onEnterCarnet} className="nav-link">{t('nav.notebook')}</button>
        <button onClick={onEnterCollection} className="nav-link">{t('nav.map')}</button>
        <button onClick={onEnterSeuil} className="nav-link nav-link-gold">{t('nav.seuil')}</button>
        {onDisconnect && <button onClick={onDisconnect} className="nav-link nav-link-muted">{t('nav.disconnect')}</button>}
      </nav>

      {/* Mobile hamburger menu */}
      <div className="mobile-menu-container">
        <button
          className="mobile-menu-toggle"
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
          <span style={{ width: '20px', height: '2px', background: '#003D2C', opacity: 0.7, transition: 'all 0.3s' }} />
          <span style={{ width: '20px', height: '2px', background: '#003D2C', opacity: 0.7, transition: 'all 0.3s' }} />
          <span style={{ width: '20px', height: '2px', background: '#003D2C', opacity: 0.7, transition: 'all 0.3s' }} />
        </button>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div
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
            {/* Close button */}
            <button
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
            >
              ×
            </button>

            {/* Primary nav group */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#003D2C', opacity: 0.4, marginBottom: '12px' }}>Explorer</p>
              <button onClick={() => { onEnterQuetes(); setMobileMenuOpen(false); }} className="mobile-nav-link">{t('nav.quests')}</button>
              <button onClick={() => { onEnterCarnet(); setMobileMenuOpen(false); }} className="mobile-nav-link">{t('nav.notebook')}</button>
              <button onClick={() => { onEnterCollection(); setMobileMenuOpen(false); }} className="mobile-nav-link">{t('nav.map')}</button>
            </div>

            {/* Secondary nav group */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#003D2C', opacity: 0.4, marginBottom: '12px' }}>Approfondir</p>
              {onEnterMeridiens && <button onClick={() => { onEnterMeridiens(); setMobileMenuOpen(false); }} className="mobile-nav-link">{t('nav.meridiens')}</button>}
              <button onClick={() => { onEnterEtudes(); setMobileMenuOpen(false); }} className="mobile-nav-link">{t('nav.etudes')}</button>
              <button onClick={() => { onEnterSeuil(); setMobileMenuOpen(false); }} className="mobile-nav-link mobile-nav-link-gold">{t('nav.seuil')}</button>
            </div>

            {/* Account group */}
            {onDisconnect && (
              <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(0,61,44,0.1)' }}>
                <button onClick={() => { onDisconnect(); setMobileMenuOpen(false); }} className="mobile-nav-link mobile-nav-link-muted">{t('nav.disconnect')}</button>
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
          paddingBottom: 'max(48px, calc(env(safe-area-inset-bottom, 0px) + 24px))',
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
