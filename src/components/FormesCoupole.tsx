/**
 * FORMES — CARTE COUPOLE
 * Architecture de la sphère, centre, couronnement
 */

import { useState } from 'react';
import { BackButton } from './BackButton';

interface FormesCoupoleProps {
  onReturn: () => void;
}

interface Typologie {
  titre: string;
  fonction: string;
  formes: string;
  effet: string;
}

interface Exemple {
  nom: string;
  description: string;
}

interface Question {
  question: string;
  options: string[];
  reponse: string;
}

const TYPOLOGIES: Typologie[] = [
  {
    titre: 'Coupole sacrée',
    fonction: 'Mettre en relation le corps et le ciel.',
    formes: 'Basilique, église, sanctuaire.',
    effet: 'Élévation, recentrage, suspension du temps.'
  },
  {
    titre: 'Coupole civique',
    fonction: 'Instituer une mémoire commune.',
    formes: 'Panthéon, institutions.',
    effet: 'Gravité, solennité, permanence.'
  },
  {
    titre: 'Coupole commerciale',
    fonction: 'Produire un espace spectaculaire.',
    formes: 'Grands magasins.',
    effet: 'Fascination, circulation ralentie, consommation ritualisée.'
  },
  {
    titre: 'Coupole urbaine / signal',
    fonction: 'Marquer la ville depuis loin.',
    formes: 'Dômes visibles dans le paysage.',
    effet: 'Repère, domination visuelle, centralité symbolique.'
  }
];

const EXEMPLES: Exemple[] = [
  {
    nom: 'Les Invalides',
    description: 'Coupole comme couronnement d\'autorité et de mémoire.'
  },
  {
    nom: 'Le Panthéon',
    description: 'Coupole civique : gravité, permanence, monument.'
  },
  {
    nom: 'Sacré-Cœur',
    description: 'Coupole dominante : présence, visibilité, surplomb.'
  },
  {
    nom: 'Galeries Lafayette',
    description: 'Coupole marchande : ciel du commerce, fascination.'
  },
  {
    nom: 'Bourse de Commerce',
    description: 'Espace circulaire : centre, contrôle, stabilité.'
  }
];

const QUESTIONS: Question[] = [
  {
    question: 'En entrant sous une coupole, ton regard :',
    options: ['cherche la sortie', 'monte vers le sommet', 'reste au niveau du corps'],
    reponse: 'monte vers le sommet'
  },
  {
    question: 'La coupole agit surtout comme :',
    options: ['une protection', 'une enveloppe', 'une contrainte'],
    reponse: 'une enveloppe'
  },
  {
    question: 'Comparée à un axe, la coupole :',
    options: ['met en mouvement', 'fixe un centre', 'ouvre un parcours'],
    reponse: 'fixe un centre'
  },
  {
    question: 'Sous une coupole, le corps se sent :',
    options: ['dispersé', 'aligné', 'recentré'],
    reponse: 'recentré'
  },
  {
    question: 'Une coupole marchande fonctionne surtout par :',
    options: ['orientation', 'fascination', 'rapidité'],
    reponse: 'fascination'
  },
  {
    question: 'La coupole transforme un lieu en :',
    options: ['décor', 'passage', 'monde autonome'],
    reponse: 'monde autonome'
  }
];

const TEXTE_RYTHME_90S = `La coupole n'est jamais décorative.
Elle rassemble l'espace sous une même courbe.
Là où l'axe trace une ligne, elle fixe un centre.
Entrer sous une coupole, c'est accepter d'être contenu.
Même profane, elle produit un ciel construit.

La coupole transforme un lieu en monde autonome.
Elle remplace le ciel par une forme construite.
Elle crée un espace hiérarchisé, centré, lisible.

Sous une coupole, le corps se sent recentré.
Le regard monte vers le sommet.
L'espace devient totalité.`;

export function FormesCoupole({ onReturn }: FormesCoupoleProps) {
  const [showAcceleration, setShowAcceleration] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  // Acceleration (Rythme 90s)
  if (showAcceleration) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          padding: '80px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ maxWidth: '700px' }}>
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(18px, 2.2vw, 24px)',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              whiteSpace: 'pre-line',
              marginBottom: '64px'
            }}
          >
            {TEXTE_RYTHME_90S}
          </div>

          <button
            onClick={() => setShowAcceleration(false)}
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
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Quiz
  if (showQuiz) {
    if (quizFinished) {
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
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
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
              La coupole rassemble.{'\n'}
              Tu peux maintenant la reconnaître.
            </div>

            <button
              onClick={() => {
                setShowQuiz(false);
                setQuizFinished(false);
                setCurrentQuestion(0);
                setSelectedAnswer(null);
              }}
              style={{
                background: 'transparent',
                border: '0.5px solid rgba(0, 61, 44, 0.25)',
                padding: '16px 32px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#003D2C',
                cursor: 'pointer',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
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
              Retour à Coupole
            </button>
          </div>
        </div>
      );
    }

    const question = QUESTIONS[currentQuestion];

    return (
      <div 
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          padding: 'clamp(24px, 5vw, 80px)'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div 
            style={{
              marginBottom: '64px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <button
              onClick={() => setShowQuiz(false)}
              style={{
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
                transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
            >
              ← Retour
            </button>

            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.3
              }}
            >
              {currentQuestion + 1} / {QUESTIONS.length}
            </div>
          </div>

          {/* Question */}
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div 
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 'clamp(24px, 3.5vw, 36px)',
                fontWeight: 400,
                lineHeight: 1.4,
                color: '#1A1A1A',
                marginBottom: '48px'
              }}
            >
              {question.question}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
              {question.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedAnswer(option);
                    setTimeout(() => {
                      if (currentQuestion < QUESTIONS.length - 1) {
                        setCurrentQuestion(currentQuestion + 1);
                        setSelectedAnswer(null);
                      } else {
                        setQuizFinished(true);
                      }
                    }, 800);
                  }}
                  style={{
                    background: selectedAnswer === option ? 'rgba(0, 61, 44, 0.05)' : 'transparent',
                    border: '0.5px solid rgba(26, 26, 26, 0.15)',
                    padding: '20px 24px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    color: '#1A1A1A',
                    cursor: 'pointer',
                    transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedAnswer) {
                      e.currentTarget.style.background = 'rgba(26, 26, 26, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedAnswer) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.15)';
                    }
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page principale
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 80px)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div 
        style={{
          maxWidth: '1400px',
          margin: '0 auto 64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <BackButton fallbackHref="#etudes" label="← Retour" />

        <h1 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 400,
            color: '#1A1A1A'
          }}
        >
          La Coupole
        </h1>

        <div style={{ width: '80px' }} />
      </div>

      {/* Layout principal : single column (no image) */}
      <div 
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'clamp(40px, 5vw, 80px)',
          alignItems: 'start'
        }}
        className="formes-layout"
      >
        {/* Contenu */}
        <div style={{ paddingBottom: '120px' }}>
          {/* Overline */}
          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: '16px'
            }}
          >
            ARCHITECTURE DE LA SPHÈRE, CENTRE, COURONNEMENT
          </div>

          {/* Hero italic */}
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(20px, 2.5vw, 28px)',
              fontWeight: 400,
              lineHeight: 1.5,
              fontStyle: 'italic',
              color: '#1A1A1A',
              marginBottom: '80px',
              opacity: 0.7,
              whiteSpace: 'pre-line'
            }}
          >
            La coupole n'est jamais décorative.{'\n'}
            Elle rassemble l'espace sous une même courbe.{'\n'}
            Là où l'axe trace une ligne, elle fixe un centre.{'\n'}
            Entrer sous une coupole, c'est accepter d'être contenu.{'\n'}
            Même profane, elle produit un ciel construit.
          </div>

          {/* Définition */}
          <div style={{ marginBottom: '80px' }}>
            <h2 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4,
                marginBottom: '24px'
              }}
            >
              Définition
            </h2>

            <div 
              style={{
                background: 'rgba(0, 61, 44, 0.02)',
                border: '1px solid rgba(0, 61, 44, 0.1)',
                padding: '32px',
                marginBottom: '24px'
              }}
            >
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  marginBottom: '12px',
                  opacity: 0.6
                }}
              >
                Courte
              </div>
              <p 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: '#1A1A1A'
                }}
              >
                La coupole est une structure sphérique qui rassemble l'espace autour d'un centre et produit un effet de totalité.
              </p>
            </div>

            <div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#1A1A1A',
                  marginBottom: '12px',
                  opacity: 0.4
                }}
              >
                Développée
              </div>
              <p 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: '#1A1A1A',
                  opacity: 0.7
                }}
              >
                Architecturalement, la coupole est la réponse à la ligne : là où l'axe organise le déplacement, la coupole organise la présence. Elle crée un espace hiérarchisé, centré, lisible. Symboliquement, elle remplace le ciel par une forme construite et transforme un lieu en monde autonome.
              </p>
            </div>
          </div>

          {/* Typologies */}
          <div style={{ marginBottom: '80px' }}>
            <h2 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4,
                marginBottom: '32px'
              }}
            >
              Typologies principales
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {TYPOLOGIES.map((type, i) => (
                <div 
                  key={i}
                  style={{
                    background: 'rgba(0, 61, 44, 0.02)',
                    border: '1px solid rgba(0, 61, 44, 0.1)',
                    padding: '24px'
                  }}
                >
                  <div 
                    style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: '18px',
                      fontWeight: 500,
                      color: '#1A1A1A',
                      marginBottom: '16px'
                    }}
                  >
                    {i + 1}) {type.titre}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span 
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '11px',
                          fontWeight: 500,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#003D2C',
                          opacity: 0.6
                        }}
                      >
                        Fonction :
                      </span>
                      <span 
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#1A1A1A',
                          opacity: 0.7,
                          marginLeft: '8px'
                        }}
                      >
                        {type.fonction}
                      </span>
                    </div>

                    <div>
                      <span 
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '11px',
                          fontWeight: 500,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#003D2C',
                          opacity: 0.6
                        }}
                      >
                        Formes :
                      </span>
                      <span 
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#1A1A1A',
                          opacity: 0.7,
                          marginLeft: '8px'
                        }}
                      >
                        {type.formes}
                      </span>
                    </div>

                    <div>
                      <span 
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '11px',
                          fontWeight: 500,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#003D2C',
                          opacity: 0.6
                        }}
                      >
                        Effet :
                      </span>
                      <span 
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#1A1A1A',
                          opacity: 0.7,
                          marginLeft: '8px',
                          fontStyle: 'italic'
                        }}
                      >
                        {type.effet}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exemples à Paris */}
          <div style={{ marginBottom: '80px' }}>
            <h2 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4,
                marginBottom: '32px'
              }}
            >
              Exemples à Paris
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {EXEMPLES.map((exemple, i) => (
                <div 
                  key={i}
                  style={{
                    borderLeft: '2px solid rgba(0, 61, 44, 0.2)',
                    paddingLeft: '16px'
                  }}
                >
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1A1A1A',
                      marginBottom: '6px'
                    }}
                  >
                    {exemple.nom}
                  </div>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: '#1A1A1A',
                      opacity: 0.6,
                      fontStyle: 'italic'
                    }}
                  >
                    — {exemple.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAcceleration(true)}
              style={{
                background: 'transparent',
                border: '0.5px solid rgba(0, 61, 44, 0.25)',
                padding: '16px 32px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#003D2C',
                cursor: 'pointer',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
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
              Rythme 90s
            </button>

            <button
              onClick={() => setShowQuiz(true)}
              style={{
                background: 'transparent',
                border: '0.5px solid rgba(0, 61, 44, 0.25)',
                padding: '16px 32px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#003D2C',
                cursor: 'pointer',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
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
              QUESTIONS D'ATTENTION (6)
            </button>

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
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              Retour
            </button>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .formes-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
