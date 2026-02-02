import { MamlukGrid } from './MamlukGrid';
import { BackButton } from './BackButton';
import { useState } from 'react';
// Imgur images for better visual experience
const luteceImg = 'https://i.imgur.com/1uLhXial.jpeg';
const revolutionImg = 'https://i.imgur.com/iyCcmoSl.jpeg';
const tableImg = 'https://i.imgur.com/VtWPT2Ml.jpeg';

interface QuetesV1Props {
  onSelectQuete: (queteId: string) => void;
  onBack: () => void;
}

interface QueteCard {
  id: string;
  title: string;
  registre: string;
  theme: string;
  shortDescription: string;
  image: string;
  duree: string;
}

const QUETES: QueteCard[] = [
  {
    id: 'lutece',
    title: 'LUTÈCE — ORIGINE',
    registre: 'FONDATION · GESTE · MESURE',
    theme: 'Paris commence comme un passage : une île, un pont, un axe.',
    shortDescription: 'Avant les palais, avant les façades, Paris fut une solution. Un endroit où l\'eau accepte d\'être franchie.',
    image: luteceImg,
    duree: '≈ 1h30–2h'
  },
  {
    id: '1789',
    title: '1789 — DÉCISION',
    registre: 'SEUIL · RÉVOLUTION · PASSAGE',
    theme: 'La Révolution n\'est pas une idée : c\'est une trajectoire.',
    shortDescription: 'Paris ne devient révolutionnaire que lorsqu\'il devient poreux. Un lieu où l\'on parle trop, où l\'on écoute trop.',
    image: revolutionImg,
    duree: '≈ 2h–2h30'
  },
  {
    id: 'table',
    title: 'VIN & TABLE — VIE PARISIENNE',
    registre: 'NOURRITURE · CORPS · VILLE VIVANTE',
    theme: 'Une ville mange, boit, respire.',
    shortDescription: 'Une ville se raconte par ce qu\'elle avale. Paris est une gorge, un ventre, une bouche. Elle a toujours eu faim. Elle a toujours eu soif.',
    image: tableImg,
    duree: '≈ 2h30–3h'
  },
  {
    id: 'temporal-meridians',
    title: 'MÉRIDIENS TEMPORELS',
    registre: 'SEUIL · TEMPS · ORIGINE',
    theme: 'Saint-Sulpice, l\'horloge, le zéro.',
    shortDescription: 'Une courte marche le long du temps : le méridien à Saint-Sulpice, l\'heure civile à la Conciergerie, le point d\'où partent les distances.',
    image: luteceImg,
    duree: '≈ 45–60 min'
  }
];

/**
 * QUÊTES V1 — ARCHÉ
 * 
 * Trois manières d'entrer dans Paris.
 * Rien de plus.
 * 
 * Structure :
 * - 3 cartes uniquement
 * - Chaque carte = une porte symbolique
 * - 1 image par carte
 * - Au clic : page de détail
 * 
 * Pas de :
 * - Choix infini
 * - Catalogue
 * - Filtres
 * - Score
 */
export function QuetesV1({ onSelectQuete, onBack }: QuetesV1Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        background: '#FAF8F2',
        overflow: 'hidden'
      }}
    >
      {/* Ghost Grid Mamluk */}
      <MamlukGrid pattern="star12" opacity={0.025} scale={1.2} rotation={15} layers={2} />

      {/* Back button */}
      <BackButton onClick={onBack} />

      {/* Container principal */}
      <div 
        className="quetes-container"
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(60px, 8vh, 80px)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Header */}
        <header 
          className="quetes-header"
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(24px, 3vh, 32px)',
            paddingBottom: 'var(--space-md)',
            borderBottom: '1px solid #DBD4C6'
          }}
        >
          <h1 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: '600',
              letterSpacing: '-0.02em',
              color: '#1A1A1A',
              marginBottom: 'var(--space-sm)',
              lineHeight: '1.1'
            }}
          >
            Marches
          </h1>
          
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(14px, 1.5vw, 16px)',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.6,
              lineHeight: '1.6'
            }}
          >
            Choisissez une porte.
          </p>
        </header>

        {/* Grille des cartes (4 : Lutèce, 1789, Table, Méridiens) */}
        <div 
          className="quetes-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'clamp(20px, 2.5vw, 32px)',
            marginBottom: 'var(--space-lg)',
            maxWidth: '1400px',
            margin: '0 auto'
          }}
        >
          {QUETES.map((quete) => (
            <button
              key={quete.id}
              onClick={() => onSelectQuete(quete.id)}
              onMouseEnter={() => setHoveredId(quete.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all var(--transition)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                transform: hoveredId === quete.id ? 'translateY(-8px)' : 'translateY(0)'
              }}
            >
              {/* IMAGE PLEIN CADRE CARRÉ */}
              <div 
                className="quete-image"
                style={{
                  aspectRatio: '1 / 1',
                  width: '100%',
                  maxHeight: '50vh',
                  background: '#E7E1D8',
                  position: 'relative',
                  overflow: 'hidden',
                  border: hoveredId === quete.id ? '2px solid #003D2C' : '1px solid #E7E1D8',
                  transition: 'all var(--transition)',
                  boxShadow: hoveredId === quete.id ? '0 12px 32px rgba(0, 61, 44, 0.12)' : 'none'
                }}
              >
                <img 
                  src={quete.image} 
                  alt={quete.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform var(--transition)',
                    transform: hoveredId === quete.id ? 'scale(1.05)' : 'scale(1)'
                  }}
                />
              </div>

              {/* TEXTE PREVIEW EN DESSOUS */}
              <div style={{ paddingTop: '16px' }}>
                {/* Titre */}
                <h2 
                  className="quetes-card h2"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(20px, 2vw, 28px)',
                    fontWeight: '600',
                    color: '#1A1A1A',
                    marginBottom: '10px',
                    letterSpacing: '-0.01em',
                    lineHeight: '1.2'
                  }}
                >
                  {quete.title}
                </h2>

                {/* Registre */}
                <p 
                  className="small-caps"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'clamp(8px, 0.85vw, 10px)',
                    letterSpacing: '0.15em',
                    color: '#1A1A1A',
                    opacity: 0.4,
                    fontWeight: '300'
                  }}
                >
                  {quete.registre}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Note de bas de page */}
        <footer 
          style={{
            textAlign: 'center',
            paddingTop: 'var(--space-xl)',
            borderTop: '1px solid #DBD4C6'
          }}
        >
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.5
            }}
          >
            La quête existe dans la marche, pas dans l'écran.
          </p>
        </footer>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .quetes-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 768px) {
          .quetes-container {
            padding: var(--space-lg) !important;
            padding-top: 80px !important;
          }
          
          .quetes-header h1 {
            font-size: 36px !important;
          }
          
          .quetes-header p {
            font-size: 16px !important;
          }
          
          .quetes-card h2 {
            font-size: 26px !important;
          }
          
          .quetes-card {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}