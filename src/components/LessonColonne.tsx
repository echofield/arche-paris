/**
 * ÉTUDES — FORMES / COLONNE (VERSION RÉVISÉE)
 * 
 * Structure :
 * 1. FORME (essence)
 * 2. HISTOIRE (repères simples)
 * 3. TYPES (3 catégories)
 * 4. PRATIQUE (observer)
 * 5. CLÔTURE (silence)
 * 
 * Design : Minimal, respiration maximale
 */

import { useState } from 'react';

interface LessonColonneProps {
  onReturn: () => void;
}

type Stage = 'titre' | 'forme' | 'histoire' | 'types' | 'pratique' | 'closure';

export function LessonColonne({ onReturn }: LessonColonneProps) {
  const [stage, setStage] = useState<Stage>('titre');

  const handleNext = () => {
    const stages: Stage[] = ['titre', 'forme', 'histoire', 'types', 'pratique', 'closure'];
    const currentIndex = stages.indexOf(stage);
    if (currentIndex < stages.length - 1) {
      setStage(stages[currentIndex + 1]);
    }
  };

  const handleComplete = () => {
    onReturn();
  };

  // Styles communs
  const containerStyle = {
    minHeight: '100vh',
    background: '#FAF8F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    position: 'relative' as const
  };

  const contentStyle = {
    maxWidth: '700px',
    width: '100%'
  };

  const titleStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#1A1A1A',
    opacity: 0.4,
    marginBottom: '32px',
    textAlign: 'center' as const
  };

  const headingStyle = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontSize: 'clamp(32px, 5vw, 48px)',
    fontWeight: 400,
    lineHeight: 1.3,
    color: '#1A1A1A',
    opacity: 0.9,
    marginBottom: '48px',
    textAlign: 'center' as const
  };

  const bodyStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '17px',
    fontWeight: 400,
    lineHeight: 2.0,
    color: '#1A1A1A',
    opacity: 0.7,
    textAlign: 'left' as const
  };

  const buttonStyle = {
    background: 'transparent',
    border: '0.5px solid rgba(26, 26, 26, 0.2)',
    padding: '16px 48px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#1A1A1A',
    opacity: 0.5,
    cursor: 'pointer',
    transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
    marginTop: '64px'
  };

  // ÉCRAN : TITRE
  if (stage === 'titre') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <h1 style={headingStyle}>COLONNE</h1>
          
          <p style={{ ...bodyStyle, textAlign: 'center', fontSize: '21px', opacity: 0.6, marginBottom: '64px' }}>
            La forme précède la fonction.
          </p>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleNext}
              style={buttonStyle}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN : FORME (essence)
  if (stage === 'forme') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={titleStyle}>FORME</div>
          
          <div style={bodyStyle}>
            <p style={{ marginBottom: '2em' }}>
              Une colonne n'est pas un objet.
              <br />
              C'est une décision verticale.
            </p>
            
            <p style={{ marginBottom: 0 }}>
              Elle organise l'espace avant de le décorer.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleNext}
              style={buttonStyle}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN : HISTOIRE (repères)
  if (stage === 'histoire') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={titleStyle}>HISTOIRE — REPÈRES</div>
          
          <div style={bodyStyle}>
            <div style={{ marginBottom: '2.5em' }}>
              <div style={{ fontSize: '14px', opacity: 0.5, marginBottom: '0.5em', letterSpacing: '0.05em' }}>
                –2500 av. J.-C.
              </div>
              <div>
                Colonnes égyptiennes — pierre, symboles, verticalité sacrée
              </div>
            </div>

            <div style={{ marginBottom: '2.5em' }}>
              <div style={{ fontSize: '14px', opacity: 0.5, marginBottom: '0.5em', letterSpacing: '0.05em' }}>
                –600 av. J.-C.
              </div>
              <div>
                Grèce — Dorique, Ionique, Corinthien
                <br />
                La colonne devient proportion
              </div>
            </div>

            <div style={{ marginBottom: '3em' }}>
              <div style={{ fontSize: '14px', opacity: 0.5, marginBottom: '0.5em', letterSpacing: '0.05em' }}>
                Ier siècle
              </div>
              <div>
                Rome — standardisation, répétition, pouvoir
              </div>
            </div>

            <div style={{ 
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '19px',
              fontStyle: 'italic',
              opacity: 0.6,
              lineHeight: 1.6
            }}>
              Chaque époque utilise la colonne
              <br />
              pour dire ce qu'elle soutient vraiment.
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleNext}
              style={buttonStyle}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN : TYPES (3 catégories)
  if (stage === 'types') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={titleStyle}>TROIS FORMES DE COLONNES</div>
          
          <div style={bodyStyle}>
            <div style={{ marginBottom: '3em' }}>
              <div style={{ 
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '21px',
                fontWeight: 500,
                marginBottom: '0.8em',
                opacity: 0.9
              }}>
                Colonne dorique
              </div>
              <div style={{ opacity: 0.65, marginBottom: '0.8em' }}>
                Force. Simplicité. Masse.
              </div>
              <div style={{ fontSize: '15px', opacity: 0.5, fontStyle: 'italic' }}>
                Elle tient sans expliquer.
              </div>
            </div>

            <div style={{ marginBottom: '3em' }}>
              <div style={{ 
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '21px',
                fontWeight: 500,
                marginBottom: '0.8em',
                opacity: 0.9
              }}>
                Colonne ionique
              </div>
              <div style={{ opacity: 0.65, marginBottom: '0.8em' }}>
                Équilibre. Rythme. Transition.
              </div>
              <div style={{ fontSize: '15px', opacity: 0.5, fontStyle: 'italic' }}>
                Elle relie plus qu'elle ne porte.
              </div>
            </div>

            <div style={{ marginBottom: 0 }}>
              <div style={{ 
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '21px',
                fontWeight: 500,
                marginBottom: '0.8em',
                opacity: 0.9
              }}>
                Colonne corinthienne
              </div>
              <div style={{ opacity: 0.65, marginBottom: '0.8em' }}>
                Décor. Élaboration. Exubérance.
              </div>
              <div style={{ fontSize: '15px', opacity: 0.5, fontStyle: 'italic' }}>
                Elle montre ce que la structure permet.
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleNext}
              style={buttonStyle}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN : PRATIQUE (observer)
  if (stage === 'pratique') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={titleStyle}>PRATIQUE — RECONNAÎTRE</div>
          
          <div style={bodyStyle}>
            <p style={{ marginBottom: '2em' }}>
              Observe un espace autour de toi.
            </p>

            <p style={{ marginBottom: '2em' }}>
              Repère ce qui joue le rôle de colonne,
              <br />
              même sans cylindre.
            </p>

            <p style={{ marginBottom: '3em' }}>
              Un mur.
              <br />
              Une personne.
              <br />
              Une règle.
            </p>

            <div style={{ 
              fontSize: '15px',
              opacity: 0.4,
              fontStyle: 'italic',
              lineHeight: 1.8
            }}>
              La colonne n'est pas toujours visible.
              <br />
              Elle est toujours structurante.
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleNext}
              style={buttonStyle}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN : CLÔTURE (silence)
  if (stage === 'closure') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={titleStyle}>CLOSURE</div>
          
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 400,
            lineHeight: 1.6,
            color: '#1A1A1A',
            opacity: 0.7,
            textAlign: 'center',
            marginBottom: '80px'
          }}>
            Ce qui soutient n'a pas besoin de s'imposer.
          </p>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleComplete}
              style={{ ...buttonStyle, opacity: 0.4 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
