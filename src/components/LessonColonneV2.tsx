/**
 * ÉTUDES — FORMES / COLONNE (Version définitive V1)
 * 
 * Structure :
 * 1. Ouverture (phrase unique)
 * 2. Histoire courte (repères)
 * 3. Types (3 maximum)
 * 4. Lecture spatiale (Paris)
 * 5. Pratique (attention, sans validation)
 * 6. Clôture (phrase unique)
 * 
 * Design : Cohérent avec le hub (cartes claires, fond texturé, rythme lent)
 * Principe : Rendre visible, pas enseigner
 */

import { useState } from 'react';

interface LessonColonneV2Props {
  onReturn: () => void;
}

type Stage = 'ouverture' | 'histoire' | 'types' | 'lecture' | 'pratique' | 'cloture';

export function LessonColonneV2({ onReturn }: LessonColonneV2Props) {
  const [stage, setStage] = useState<Stage>('ouverture');

  const handleNext = () => {
    const stages: Stage[] = ['ouverture', 'histoire', 'types', 'lecture', 'pratique', 'cloture'];
    const currentIndex = stages.indexOf(stage);
    if (currentIndex < stages.length - 1) {
      setStage(stages[currentIndex + 1]);
    }
  };

  const handleComplete = () => {
    onReturn();
  };

  // Styles communs (cohérents avec le hub)
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

  const labelStyle = {
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

  // ÉCRAN 1 : OUVERTURE
  if (stage === 'ouverture') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={labelStyle}>COLONNE</div>
          
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(28px, 4vw, 36px)',
            fontWeight: 400,
            lineHeight: 1.4,
            color: '#1A1A1A',
            opacity: 0.8,
            textAlign: 'center',
            marginBottom: '64px'
          }}>
            La colonne élève la charge en la rendant visible.
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

  // ÉCRAN 2 : HISTOIRE COURTE
  if (stage === 'histoire') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={labelStyle}>HISTOIRE</div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '0.5px solid rgba(26, 26, 26, 0.08)',
            padding: '48px'
          }}>
            {/* Antiquité */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: '#1A1A1A',
                opacity: 0.5,
                marginBottom: '8px'
              }}>
                Antiquité
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#1A1A1A',
                opacity: 0.7
              }}>
                Pierre taillée, verticalité sacrée, ordres grecs.
                <br />
                La colonne devient proportion.
              </div>
            </div>

            {/* Renaissance */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: '#1A1A1A',
                opacity: 0.5,
                marginBottom: '8px'
              }}>
                Renaissance
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#1A1A1A',
                opacity: 0.7
              }}>
                Réinterprétation des ordres antiques.
                <br />
                Codification, répétition, harmonie.
              </div>
            </div>

            {/* Ville moderne */}
            <div style={{ marginBottom: 0 }}>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: '#1A1A1A',
                opacity: 0.5,
                marginBottom: '8px'
              }}>
                Ville moderne
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#1A1A1A',
                opacity: 0.7
              }}>
                Acier, béton, structure invisible.
                <br />
                La colonne cache son rôle.
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

  // ÉCRAN 3 : TYPES (3 maximum)
  if (stage === 'types') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={labelStyle}>TYPES</div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Dorique */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '0.5px solid rgba(26, 26, 26, 0.08)',
              padding: '32px'
            }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '21px',
                fontWeight: 400,
                color: '#1A1A1A',
                marginBottom: '8px',
                opacity: 0.9
              }}>
                Colonne dorique
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#1A1A1A',
                opacity: 0.6
              }}>
                Force. Simplicité. Elle tient sans expliquer.
              </div>
            </div>

            {/* Ionique */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '0.5px solid rgba(26, 26, 26, 0.08)',
              padding: '32px'
            }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '21px',
                fontWeight: 400,
                color: '#1A1A1A',
                marginBottom: '8px',
                opacity: 0.9
              }}>
                Colonne ionique
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#1A1A1A',
                opacity: 0.6
              }}>
                Équilibre. Rythme. Elle relie plus qu'elle ne porte.
              </div>
            </div>

            {/* Corinthienne */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '0.5px solid rgba(26, 26, 26, 0.08)',
              padding: '32px'
            }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '21px',
                fontWeight: 400,
                color: '#1A1A1A',
                marginBottom: '8px',
                opacity: 0.9
              }}>
                Colonne corinthienne
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#1A1A1A',
                opacity: 0.6
              }}>
                Décor. Élaboration. Elle montre ce que la structure permet.
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

  // ÉCRAN 4 : LECTURE SPATIALE (Paris)
  if (stage === 'lecture') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={labelStyle}>LECTURE SPATIALE</div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '0.5px solid rgba(26, 26, 26, 0.08)',
            padding: '48px'
          }}>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '17px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              opacity: 0.7,
              marginBottom: '24px'
            }}>
              Panthéon, Madeleine, Assemblée nationale.
            </p>

            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '17px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              opacity: 0.7,
              marginBottom: '24px'
            }}>
              Avant d'être des monuments, ce sont des points sur une ligne.
            </p>

            <p style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '19px',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              opacity: 0.5,
              fontStyle: 'italic',
              marginBottom: 0
            }}>
              Les colonnes ne décorent pas.
              <br />
              Elles révèlent l'ordre du pouvoir.
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

  // ÉCRAN 5 : PRATIQUE
  if (stage === 'pratique') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={labelStyle}>PRATIQUE</div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '0.5px solid rgba(26, 26, 26, 0.08)',
            padding: '48px'
          }}>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '17px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              opacity: 0.7,
              marginBottom: '24px'
            }}>
              Observe un espace autour de toi.
            </p>

            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '17px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              opacity: 0.7,
              marginBottom: '24px'
            }}>
              Repère ce qui joue le rôle de colonne,
              <br />
              même sans cylindre visible.
            </p>

            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              opacity: 0.5,
              fontStyle: 'italic',
              marginBottom: 0
            }}>
              Un mur. Une personne. Une règle.
              <br />
              La colonne n'est pas toujours visible.
              <br />
              Elle est toujours structurante.
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

  // ÉCRAN 6 : CLÔTURE
  if (stage === 'cloture') {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 400,
            lineHeight: 1.5,
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
