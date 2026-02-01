/**
 * ÉTUDES — LANGAGES
 * Hub principal avec 3 cartes (Origine / Salon / Argot) + Accélération
 */

import { useState } from 'react';
import { LangagesOrigine } from './LangagesOrigine';
import { LangagesSalon } from './LangagesSalon';
import { LangagesArgot } from './LangagesArgot';
import { LangagesAcceleration } from './LangagesAcceleration';
import { LangagesTest } from './LangagesTest';

type LangagesState = 'hub' | 'origine' | 'salon' | 'argot' | 'acceleration' | 'test';

interface EtudesLangagesProps {
  onReturn: () => void;
}

interface Card {
  id: string;
  title: string;
  subtitle: string;
}

const CARDS: Card[] = [
  {
    id: 'origine',
    title: 'Origine',
    subtitle: 'Stratification · Géographie · Cryptage'
  },
  {
    id: 'salon',
    title: 'Salon',
    subtitle: 'Norme · Distinction · Fixation'
  },
  {
    id: 'argot',
    title: 'Argot',
    subtitle: 'Cacher · Transmettre · Survivre'
  }
];

export function EtudesLangages({ onReturn }: EtudesLangagesProps) {
  const [currentView, setCurrentView] = useState<LangagesState>('hub');

  // Navigation
  if (currentView === 'origine') {
    return <LangagesOrigine onReturn={() => setCurrentView('hub')} onTest={() => setCurrentView('test')} />;
  }
  
  if (currentView === 'salon') {
    return <LangagesSalon onReturn={() => setCurrentView('hub')} onTest={() => setCurrentView('test')} />;
  }
  
  if (currentView === 'argot') {
    return <LangagesArgot onReturn={() => setCurrentView('hub')} onTest={() => setCurrentView('test')} />;
  }

  if (currentView === 'acceleration') {
    return <LangagesAcceleration onReturn={() => setCurrentView('hub')} />;
  }

  if (currentView === 'test') {
    return <LangagesTest onReturn={() => setCurrentView('hub')} />;
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
            Langages
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
            Paris fabrique sa langue. Trois registres ouverts.
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
            <LangagesCard
              key={card.id}
              card={card}
              onClick={() => setCurrentView(card.id as LangagesState)}
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

        {/* ACCÉLÉRATION (exercice séparé) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <button
            onClick={() => setCurrentView('acceleration')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.15)';
            }}
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'transparent',
              border: '0.5px solid rgba(0, 61, 44, 0.15)',
              padding: '48px 40px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div 
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '28px',
                fontWeight: 400,
                lineHeight: 1.3,
                color: '#003D2C',
                marginBottom: '20px'
              }}
            >
              Accélération
            </div>
            
            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4
              }}
            >
              Exercice perceptif · Sans score
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Carte individuelle
interface LangagesCardProps {
  card: Card;
  onClick: () => void;
}

function LangagesCard({ card, onClick }: LangagesCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: '0.5px solid rgba(26, 26, 26, 0.15)',
        padding: '80px 40px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
        borderColor: isHovered ? 'rgba(26, 26, 26, 0.3)' : 'rgba(26, 26, 26, 0.15)',
        minHeight: '320px'
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
    </button>
  );
}