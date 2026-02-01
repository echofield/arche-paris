/**
 * ÉTUDES — SYSTÈMES
 * Organisation urbaine et politique. Trois lectures, une dynamique.
 */

import { useState } from 'react';
import { SystemesCite } from './SystemesCite';
import { SystemesPouvoir } from './SystemesPouvoir';
import { SystemesArchitecture } from './SystemesArchitecture';

type SystemesState = 'hub' | 'cite' | 'pouvoir' | 'architecture';

interface EtudesSystemesProps {
  onReturn: () => void;
}

interface Card {
  id: string;
  title: string;
  subtitle: string;
  locked?: boolean;
}

const CARDS: Card[] = [
  {
    id: 'cite',
    title: 'Cité',
    subtitle: 'Flux · Métabolisme · Frontière'
  },
  {
    id: 'pouvoir',
    title: 'Pouvoir',
    subtitle: 'Légitimité · Coercition · Exception'
  },
  {
    id: 'architecture',
    title: 'Architecture',
    subtitle: 'Forme · Fonction · Hiérarchie'
  }
];

export function EtudesSystemes({ onReturn }: EtudesSystemesProps) {
  const [currentView, setCurrentView] = useState<SystemesState>('hub');

  // Navigation
  if (currentView === 'cite') {
    return <SystemesCite onReturn={() => setCurrentView('hub')} onTest={() => {}} />;
  }

  if (currentView === 'pouvoir') {
    return <SystemesPouvoir onReturn={() => setCurrentView('hub')} />;
  }

  if (currentView === 'architecture') {
    return <SystemesArchitecture onReturn={() => setCurrentView('hub')} />;
  }

  // Hub principal
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 80px)',
        position: 'relative'
      }}
    >
      {/* Bouton retour */}
      <button
        onClick={onReturn}
        style={{
          position: 'fixed',
          top: '40px',
          left: '40px',
          background: 'transparent',
          border: 'none',
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.4,
          cursor: 'pointer',
          transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
      >
        ← Retour
      </button>

      {/* Container central */}
      <div 
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '120px'
        }}
      >
        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(40px, 6vw, 64px)',
              fontWeight: 400,
              lineHeight: 1.2,
              color: '#1A1A1A',
              marginBottom: '24px'
            }}
          >
            Systèmes
          </h1>
          
          <p 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              opacity: 0.5,
              fontStyle: 'italic'
            }}
          >
            Organisation urbaine et politique. Trois lectures, une dynamique.
          </p>
        </div>

        {/* Les 3 cartes principales */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            marginBottom: '80px'
          }}
        >
          {CARDS.map((card) => (
            <SystemesCard
              key={card.id}
              card={card}
              onClick={() => !card.locked && setCurrentView(card.id as SystemesState)}
            />
          ))}
        </div>

        {/* Séparateur */}
        <div 
          style={{
            width: '100%',
            height: '1px',
            background: 'rgba(26, 26, 26, 0.1)',
            marginBottom: '80px'
          }}
        />

        {/* Info temporaire */}
        <div style={{ textAlign: 'center', opacity: 0.4 }}>
          <p 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontStyle: 'italic',
              color: '#1A1A1A'
            }}
          >
            Accélération et Test à venir
          </p>
        </div>
      </div>
    </div>
  );
}

// Carte individuelle
interface SystemesCardProps {
  card: Card;
  onClick: () => void;
}

function SystemesCard({ card, onClick }: SystemesCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={card.locked}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: '0.5px solid rgba(26, 26, 26, 0.15)',
        padding: '80px 40px',
        textAlign: 'center',
        cursor: card.locked ? 'not-allowed' : 'pointer',
        transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
        borderColor: isHovered && !card.locked ? 'rgba(26, 26, 26, 0.3)' : 'rgba(26, 26, 26, 0.15)',
        minHeight: '320px',
        opacity: card.locked ? 0.3 : 1
      }}
    >
      {/* Titre */}
      <div 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '40px',
          fontWeight: 400,
          lineHeight: 1.2,
          color: '#1A1A1A',
          marginBottom: '32px'
        }}
      >
        {card.title}
      </div>

      {/* Sous-titre */}
      <div 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          lineHeight: 1.8,
          color: '#1A1A1A',
          opacity: 0.4
        }}
      >
        {card.subtitle}
      </div>

      {/* Indicateur verrouillé */}
      {card.locked && (
        <div 
          style={{
            marginTop: '24px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#1A1A1A',
            opacity: 0.3
          }}
        >
          À venir
        </div>
      )}
    </button>
  );
}