/**
 * LANGAGES — ACCÉLÉRATION
 * Exercice perceptif 90s — Pas de score
 */

import { useState, useEffect } from 'react';

interface LangagesAccelerationProps {
  onReturn: () => void;
}

// Texte à afficher mot par mot
const TEXTE_ACCELERATION = `Ce
que
tu
vas
lire
n'est
pas
un
contenu.
C'est
une
traversée.
Laisse
le
sens
circuler
avant
d'analyser.`;

const MOTS = TEXTE_ACCELERATION.split('\n').filter(m => m.trim());

export function LangagesAcceleration({ onReturn }: LangagesAccelerationProps) {
  const [phase, setPhase] = useState<'intro' | 'running' | 'end'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Défilement automatique
  useEffect(() => {
    if (phase !== 'running') return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= MOTS.length - 1) {
          setPhase('end');
          return prev;
        }
        return prev + 1;
      });
    }, 700); // ~700ms par mot (rythme lent)

    return () => clearInterval(interval);
  }, [phase]);

  // Intro
  if (phase === 'intro') {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
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

        {/* Contenu intro */}
        <div 
          style={{
            maxWidth: '600px',
            textAlign: 'center'
          }}
        >
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(22px, 3vw, 32px)',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              marginBottom: '80px',
              whiteSpace: 'pre-line'
            }}
          >
            Ce que tu vas lire n'est pas un contenu.{'\n'}
            C'est une traversée.{'\n'}
            Laisse le sens circuler avant d'analyser.{'\n\n'}
            Quand tu es prêt, entre.
          </div>

          <button
            onClick={() => setPhase('running')}
            style={{
              background: 'transparent',
              border: '0.5px solid rgba(0, 61, 44, 0.25)',
              padding: '20px 48px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#003D2C',
              cursor: 'pointer',
              transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 61, 44, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.25)';
            }}
          >
            Entrer
          </button>
        </div>
      </div>
    );
  }

  // Running (défilement)
  if (phase === 'running') {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}
      >
        <div 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(40px, 8vw, 80px)',
            fontWeight: 400,
            color: '#1A1A1A',
            textAlign: 'center',
            transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 1
          }}
        >
          {MOTS[currentIndex]}
        </div>
      </div>
    );
  }

  // End
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}
    >
      <div 
        style={{
          maxWidth: '600px',
          textAlign: 'center'
        }}
      >
        <div 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 400,
            lineHeight: 1.6,
            fontStyle: 'italic',
            color: '#1A1A1A',
            marginBottom: '64px',
            opacity: 0.7
          }}
        >
          Le sens ne s'attrape pas. Il se traverse.
        </div>

        <button
          onClick={onReturn}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(26, 26, 26, 0.15)',
            padding: '16px 32px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1A1A1A',
            opacity: 0.5,
            cursor: 'pointer',
            transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5';
          }}
        >
          Retour
        </button>
      </div>
    </div>
  );
}
