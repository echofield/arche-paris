import { useState } from 'react';
import { MamlukGrid } from './MamlukGrid';
import { ParisMap } from './ParisMap';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useTranslation } from '../utils/i18n';

interface HomepageV1Props {
  onEnterQuetes: () => void;
  onEnterOrigine?: () => void;
  onEnterHistoire?: () => void;
  onEnterCarnet?: () => void;
  onEnterHunter?: () => void;
  onEnterCollection?: () => void;
  onEnterSeuil?: () => void;
  onEnterEtudes?: () => void;
}

/**
 * HOMEPAGE V1 — SEUIL (arch-citizen style)
 *
 * Centered vertical composition: title, faint map, single invitation, large sentence.
 * Tapping map or invitation opens overlay (Walks / Carnet / Études).
 */
export function HomepageV1({ onEnterQuetes, onEnterOrigine, onEnterHistoire, onEnterCarnet, onEnterHunter, onEnterCollection, onEnterSeuil, onEnterEtudes }: HomepageV1Props) {
  const { t } = useTranslation();
  const [mapOverlayOpen, setMapOverlayOpen] = useState(false);

  const handleMapTap = () => {
    if (onEnterEtudes ?? onEnterQuetes ?? onEnterCarnet) {
      setMapOverlayOpen(true);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center"
      style={{ 
        background: '#FAF8F2',
        overflow: 'hidden'
      }}
    >
      {/* Ghost Grid Mamluk — Très subtile */}
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />

      {/* Seuil — centered vertical composition */}
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(48px, 10vh, 120px) clamp(24px, 5vw, 48px)',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center'
        }}
        className="homepage-container"
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(40px, 8vw, 72px)',
            fontWeight: '400',
            color: '#1A1A1A',
            marginBottom: '4px',
            letterSpacing: '0.05em',
            lineHeight: '1'
          }}
        >
          {t('home.title')}
        </h1>
        {/* Place — cartographic label */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.5,
            marginBottom: 'clamp(24px, 4vh, 48px)'
          }}
        >
          {t('home.place')}
        </p>

        {/* Faint Paris map — memory skin, very low opacity */}
        <div
          style={{
            width: '100%',
            maxWidth: '320px',
            aspectRatio: '4 / 3',
            opacity: 0.22,
            marginBottom: 'clamp(20px, 3vh, 32px)',
            cursor: onEnterEtudes ?? onEnterQuetes ?? onEnterCarnet ? 'pointer' : 'default'
          }}
          onClick={handleMapTap}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMapTap(); } }}
          role={(onEnterEtudes ?? onEnterQuetes ?? onEnterCarnet) ? 'button' : undefined}
          tabIndex={(onEnterEtudes ?? onEnterQuetes ?? onEnterCarnet) ? 0 : undefined}
          aria-label={(onEnterEtudes ?? onEnterQuetes ?? onEnterCarnet) ? t('home.invitation') : undefined}
        >
          <ParisMap breathing={true} onTap={undefined} />
        </div>

        {/* Single invitation line — tap opens overlay */}
        <button
          type="button"
          onClick={handleMapTap}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.5,
            cursor: 'pointer',
            marginBottom: 'clamp(32px, 5vh, 56px)',
            transition: 'opacity 0.3s ease',
            padding: '8px 0'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
        >
          {t('home.invitation')}
        </button>

        {/* Large sentence — bottom call */}
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(20px, 3.5vw, 28px)',
            fontStyle: 'italic',
            color: '#1A1A1A',
            opacity: 0.9,
            lineHeight: 1.4,
            maxWidth: '400px'
          }}
        >
          {t('home.sentence')}
        </p>
      </div>

      {/* Map tap overlay — Walks / Carnet / Études (world door) */}
      <Sheet open={mapOverlayOpen} onOpenChange={setMapOverlayOpen}>
        <SheetContent side="bottom" style={{ background: '#FAF8F2', borderColor: '#DBD4C6' }}>
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A' }}>
              {t('nav.map')}
            </SheetTitle>
          </SheetHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
            <button
              onClick={() => { onEnterQuetes(); setMapOverlayOpen(false); }}
              style={{
                width: '100%',
                padding: '16px 20px',
                textAlign: 'left',
                background: 'transparent',
                border: '1px solid rgba(0, 61, 44, 0.2)',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#003D2C',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 61, 44, 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {t('nav.quests')}
            </button>
            <button
              onClick={() => { onEnterCarnet?.(); setMapOverlayOpen(false); }}
              style={{
                width: '100%',
                padding: '16px 20px',
                textAlign: 'left',
                background: 'transparent',
                border: '1px solid rgba(0, 61, 44, 0.2)',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#003D2C',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 61, 44, 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {t('nav.notebook')}
            </button>
            {onEnterEtudes && (
              <button
                onClick={() => { onEnterEtudes(); setMapOverlayOpen(false); }}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  textAlign: 'left',
                  background: 'transparent',
                  border: '1px solid rgba(0, 61, 44, 0.2)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 61, 44, 0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Études
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Navigation discrète en haut */}
      <nav 
        style={{
          position: 'absolute',
          top: 'var(--space-xl)',
          right: 'var(--space-xl)',
          display: 'flex',
          gap: '32px',
          zIndex: 100
        }}
      >
        <button
          onClick={onEnterQuetes}
          className="small-caps"
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
            transition: 'opacity var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        >
          {t('nav.quests')}
        </button>
        <button
          onClick={onEnterHistoire}
          className="small-caps"
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
            transition: 'opacity var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        >
          {t('nav.history')}
        </button>
        <button
          onClick={onEnterCarnet}
          className="small-caps"
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
            transition: 'opacity var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        >
          {t('nav.notebook')}
        </button>
        <button
          onClick={onEnterCollection}
          className="small-caps"
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
            transition: 'opacity var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        >
          {t('nav.map')}
        </button>
        <button
          onClick={onEnterSeuil}
          className="small-caps"
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
            transition: 'opacity var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          {t('nav.seuil')}
        </button>
      </nav>

      {/* Trésor Caché — Entrée mystérieuse pour Hunter */}
      <button
        onClick={onEnterHunter}
        style={{
          position: 'absolute',
          bottom: 'var(--space-lg)',
          left: 'var(--space-lg)',
          background: 'transparent',
          border: '1px dashed rgba(0, 61, 44, 0.2)',
          padding: '12px 20px',
          cursor: 'pointer',
          transition: 'all 0.4s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.5)';
          e.currentTarget.style.background = 'rgba(0, 61, 44, 0.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.2)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '14px',
            fontStyle: 'italic',
            color: '#003D2C',
            opacity: 0.6
          }}
        >
          ◇ {t('home.hidden.treasure')}
        </span>
      </button>

      {/* Signature discrète */}
      <div
        style={{
          position: 'absolute',
          bottom: 'var(--space-lg)',
          right: 'var(--space-lg)',
          fontFamily: 'var(--font-serif)',
          fontSize: '18px',
          color: '#1A1A1A',
          opacity: 0.15
        }}
      >
        {t('home.footer.signature')}
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 968px) {
          .homepage-container {
            min-height: 60vh !important;
            padding-top: clamp(64px, 12vh, 100px) !important;
          }
          nav {
            top: var(--space-md) !important;
            right: var(--space-md) !important;
            gap: 16px !important;
            font-size: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}