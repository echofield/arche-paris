import { MamlukGrid } from './MamlukGrid';
import { ParisStrokeMap } from './ParisStrokeMap';
import { ArcheSymbol } from './ArcheSymbol';
import { useTranslation } from '../utils/i18n';

interface HomepageV1Props {
  onEnterQuetes: () => void;
  onEnterOrigine?: () => void;
  onEnterHistoire?: () => void;
  onEnterCarnet?: () => void;
  onEnterHunter?: () => void;
  onEnterCollection?: () => void;
  onEnterSeuil?: () => void;
}

/**
 * HOMEPAGE V1 — LE GRAND HÔTEL
 * 
 * Seuil symbolique.
 * Pas de fonctionnalités, juste une entrée.
 * 
 * Structure :
 * - 1 image éditoriale forte (format vertical, type gravure)
 * - Titre : Le Grand Hôtel
 * - Phrase de seuil : Votre Paris commence ici.
 * - 1 CTA : Découvrir mon Paris
 * 
 * L'interface doit pouvoir exister imprimée.
 */
export function HomepageV1({ onEnterQuetes, onEnterOrigine, onEnterHistoire, onEnterCarnet, onEnterHunter, onEnterCollection, onEnterSeuil }: HomepageV1Props) {
  const { t } = useTranslation();

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center"
      style={{ 
        background: '#FAF8F2',
        overflow: 'hidden'
      }}
    >
      {/* Ghost Grid Mamluk */}
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />

      {/* ARCHE Symbol — top-left, pure presence */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '32px',
          zIndex: 100
        }}
      >
        <ArcheSymbol size={40} />
      </div>

      {/* Container principal */}
      <div 
        style={{
          maxWidth: '1200px',
          width: '100%',
          padding: 'clamp(24px, 5vw, 80px)',
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          gap: 'clamp(32px, 5vw, 80px)',
          alignItems: 'center'
        }}
        className="homepage-container"
      >
        {/* COLONNE GAUCHE — PARIS STROKE MAP */}
        <div
          style={{
            position: 'relative',
            aspectRatio: '3 / 4',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
          className="homepage-image"
        >
          {/* Paris Stroke Map — memory-like */}
          <ParisStrokeMap opacity={0.15} blur={0.8} />

          {/* Overlay text on map */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 20
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: '400',
                color: '#1A1A1A',
                letterSpacing: '0.1em',
                marginBottom: '8px',
                opacity: 0.9
              }}
            >
              ARCHE
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(18px, 3vw, 24px)',
                fontStyle: 'italic',
                color: '#1A1A1A',
                opacity: 0.6,
                marginBottom: '24px'
              }}
            >
              Paris
            </p>
            <button
              onClick={onEnterCollection}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: 'var(--font-serif)',
                fontSize: '14px',
                fontStyle: 'italic',
                color: '#003D2C',
                opacity: 0.7,
                cursor: 'pointer',
                transition: 'opacity 0.3s ease',
                textDecoration: 'underline',
                textUnderlineOffset: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              Voir la carte
            </button>
          </div>
        </div>

        {/* COLONNE DROITE — TEXTE & CTA */}
        <div>
          {/* Titre monumental */}
          <h1 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: '400',
              color: '#1A1A1A',
              marginBottom: 'var(--space-lg)',
              letterSpacing: '0.05em',
              lineHeight: '1'
            }}
          >
            ARCHÉ
          </h1>

          {/* Phrase de seuil */}
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.7,
              marginBottom: 'var(--space-xxl)',
              lineHeight: '1.6',
              maxWidth: '400px'
            }}
          >
            {t('home.subtitle')}
          </p>

          {/* CTA principal */}
          <button
            onClick={onEnterQuetes}
            style={{
              background: '#003D2C',
              color: '#FAF8F2',
              border: 'none',
              padding: '20px 48px',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00543D';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 61, 44, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#003D2C';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {t('home.cta.primary')}
          </button>

          {/* Ligne optionnelle discrète */}
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              color: '#1A1A1A',
              opacity: 0.4,
              marginTop: '24px',
              marginBottom: '48px',
              fontStyle: 'italic',
              fontWeight: '400'
            }}
          >
            {t('home.intro.note')}
          </p>

          {/* 3 CARTES ÉDITORIALES — Secondaires, silencieuses */}
          <div 
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '48px'
            }}
          >
            {/* Carte 1 — ORIGINE */}
            <button
              onClick={onEnterOrigine}
              style={{
                flex: 1,
                background: 'transparent',
                border: '0.5px solid rgba(0, 61, 44, 0.15)',
                padding: '24px 16px',
                cursor: 'pointer',
                transition: 'all var(--transition)',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 61, 44, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.15)';
              }}
            >
              <p 
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1A1A1A',
                  marginBottom: '8px'
                }}
              >
                {t('home.cards.origin.title')}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  opacity: 0.5
                }}
              >
                {t('home.cards.origin.subtitle')}
              </p>
            </button>

            {/* Carte 2 — QUÊTES */}
            <button
              onClick={onEnterQuetes}
              style={{
                flex: 1,
                background: 'transparent',
                border: '0.5px solid rgba(0, 61, 44, 0.15)',
                padding: '24px 16px',
                cursor: 'pointer',
                transition: 'all var(--transition)',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 61, 44, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.15)';
              }}
            >
              <p 
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1A1A1A',
                  marginBottom: '8px'
                }}
              >
                {t('home.cards.quests.title')}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  opacity: 0.5
                }}
              >
                {t('home.cards.quests.subtitle')}
              </p>
            </button>

            {/* Carte 3 — HISTOIRE */}
            <button
              onClick={onEnterHistoire}
              style={{
                flex: 1,
                background: 'transparent',
                border: '0.5px solid rgba(0, 61, 44, 0.15)',
                padding: '24px 16px',
                cursor: 'pointer',
                transition: 'all var(--transition)',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 61, 44, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.15)';
              }}
            >
              <p 
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1A1A1A',
                  marginBottom: '8px'
                }}
              >
                {t('home.cards.history.title')}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  opacity: 0.5
                }}
              >
                {t('home.cards.history.subtitle')}
              </p>
            </button>
          </div>
        </div>
      </div>

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
            grid-template-columns: 1fr !important;
            gap: var(--space-lg) !important;
            text-align: center !important;
          }
          
          .homepage-image {
            display: flex !important;
            order: -1;
            max-width: 400px;
            margin: 0 auto var(--space-xl) auto;
          }
          
          h1 {
            font-size: 48px !important;
          }
          
          p[style*="max-width: 400px"] {
            margin-left: auto !important;
            margin-right: auto !important;
          }
          
          button[style*="padding: 20px"] {
            width: 100%;
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
