/**
 * FORMES — CARTE SEUIL
 * Espace de transition, filtre social, épaisseur symbolique
 */

import { useState } from 'react';

interface FormesSeuilProps {
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

interface Exercice {
  titre: string;
  consigne: string;
  duree: string;
  materiel: string;
}

interface Question {
  question: string;
  options: string[];
  reponse: string;
  explication?: string;
}

interface Livre {
  auteur: string;
  titre: string;
  pourquoi: string;
}

const TYPOLOGIES: Typologie[] = [
  {
    titre: 'Seuil monumental / sacré',
    fonction: 'Transformer l\'état du corps et de l\'attention.',
    formes: 'Portail sculpté, porche, pronaos, narthex.',
    effet: 'Ralentissement, élévation, mise à distance du monde ordinaire.'
  },
  {
    titre: 'Seuil urbain / hybride',
    fonction: 'Transition entre rue et intérieur collectif.',
    formes: 'Passage couvert, galerie, arcade, perron, grille.',
    effet: 'Brouillage des limites, circulation protégée, observation.'
  },
  {
    titre: 'Seuil domestique',
    fonction: 'Filtrer l\'accès au privé.',
    formes: 'Porte cochère, vestibule, cour intérieure, escalier.',
    effet: 'Hiérarchisation sociale, contrôle discret, intimité graduée.'
  }
];

const EXEMPLES: Exemple[] = [
  {
    nom: 'Portails de Notre-Dame — 4e',
    description: 'Le seuil comme pédagogie morale sculptée.'
  },
  {
    nom: 'Panthéon (portique) — 5e',
    description: 'Seuil civique inspiré de l\'Antiquité.'
  },
  {
    nom: 'La Madeleine — 8e',
    description: 'Seuil monumental isolant du boulevard.'
  },
  {
    nom: 'Passage des Panoramas — 2e',
    description: 'Seuil marchand, intérieur de ville.'
  },
  {
    nom: 'Galerie Vivienne — 2e',
    description: 'Seuil bourgeois, rue devenue salon.'
  },
  {
    nom: 'Porte cochère haussmannienne — multiples arrondissements',
    description: 'Seuil social et fonctionnel.'
  },
  {
    nom: 'Cour d\'immeuble du Marais — 3e / 4e',
    description: 'Transition silencieuse entre ville et intimité.'
  },
  {
    nom: 'Grilles des Tuileries — 1er',
    description: 'Transparence visuelle, fermeture physique.'
  }
];

const ANECDOTES = [
  'Le portail Sainte-Anne de Notre-Dame réemploie des sculptures d\'une église antérieure : seuil temporel intégré.',
  'Les passages couverts furent parmi les premiers espaces publics éclairés au gaz à Paris (XIXe siècle).',
  'Les portes cochères possèdent souvent des chasse-roues pour protéger les jambages des carrosses.',
  'Le concierge était historiquement le gardien du seuil, plus que de l\'immeuble.',
  'Certaines grilles parisiennes sont plus coûteuses que les bâtiments qu\'elles protègent.',
  'Le perron impose une micro-élévation du corps avant l\'entrée.'
];

const EXERCICES: Exercice[] = [
  {
    titre: 'Observer',
    consigne: 'Repérer 5 seuils différents en 10 minutes de marche.',
    duree: '10 min',
    materiel: 'aucun'
  },
  {
    titre: 'Dessiner',
    consigne: 'Dessiner un seuil vu de face en 5 lignes maximum.',
    duree: '5 min',
    materiel: 'crayon / papier'
  },
  {
    titre: 'Traverser',
    consigne: 'Noter comment ton corps change en passant un seuil (vitesse, posture).',
    duree: '5 min',
    materiel: 'notes'
  }
];

const QUESTIONS: Question[] = [
  {
    question: 'Un seuil sert surtout à :',
    options: ['Décorer', 'Séparer', 'Transformer'],
    reponse: 'Transformer',
    explication: 'Le seuil change l\'état de celui qui le traverse'
  },
  {
    question: 'Une porte cochère sert d\'abord à :',
    options: ['Impressionner', 'Laisser passer un véhicule', 'Bloquer l\'entrée'],
    reponse: 'Laisser passer un véhicule',
    explication: 'Elle est conçue pour les carrosses'
  },
  {
    question: 'Un passage couvert est :',
    options: ['Privé', 'Public', 'Hybride'],
    reponse: 'Hybride',
    explication: 'Entre rue et intérieur'
  },
  {
    question: 'Le narthex appartient à :',
    options: ['L\'architecture gothique religieuse', 'L\'architecture industrielle', 'L\'architecture domestique'],
    reponse: 'L\'architecture gothique religieuse',
    explication: 'Espace d\'entrée des églises'
  },
  {
    question: 'Une grille est un seuil car :',
    options: ['Elle ferme', 'Elle cache', 'Elle montre sans laisser passer'],
    reponse: 'Elle montre sans laisser passer',
    explication: 'Transparence visuelle, fermeture physique'
  },
  {
    question: 'Le seuil est toujours :',
    options: ['Fin', 'Invisible', 'Épais'],
    reponse: 'Épais',
    explication: 'Le seuil possède une profondeur'
  }
];

const LIVRES: Livre[] = [
  {
    auteur: 'Georg Simmel',
    titre: 'Pont et Porte',
    pourquoi: 'Texte fondamental sur la notion de seuil et de relation spatiale.'
  },
  {
    auteur: 'Walter Benjamin',
    titre: 'Paris, capitale du XIXe siècle',
    pourquoi: 'Analyse des passages couverts comme seuils modernes.'
  },
  {
    auteur: 'Françoise Choay',
    titre: 'La règle et le modèle',
    pourquoi: 'Comprendre les dispositifs architecturaux et leurs fonctions sociales.'
  }
];

const TEXTE_ACCELERATION = `Un seuil n'est jamais neutre.
Il ralentit le corps, oriente le regard, modifie le comportement.
Entrer n'est pas un geste automatique : c'est un passage réglé.

Dans la ville ancienne, le seuil est épais.
On passe de la rue au porche, du porche à la cour, de la cour à l'escalier.
Chaque étape filtre, observe, protège.

Le seuil organise la coexistence.
Il permet la proximité sans confusion, la séparation sans rupture.
C'est là que s'inscrivent les règles sociales, visibles ou implicites.

À Paris, le seuil est partout :
dans la porte cochère, dans le passage couvert, dans la grille d'un jardin.
Même lorsqu'il devient invisible, il persiste sous forme de codes, d'interphones, de contrôles.

Lire une ville, c'est apprendre à reconnaître ses seuils.
Ils disent qui peut entrer, comment, à quel rythme, et sous quelles conditions.
La ville ne commence jamais d'un coup.
Elle commence toujours par un seuil.`;

export function FormesSeuil({ onReturn }: FormesSeuilProps) {
  const [showAcceleration, setShowAcceleration] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  // Acceleration
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
            {TEXTE_ACCELERATION}
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
              Le seuil n'est plus invisible.{'\n'}
              Tu peux maintenant le reconnaître.
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
              Retour à Seuil
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
          margin: '0 auto',
          marginBottom: '64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <button
          onClick={onReturn}
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

        <h1 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 400,
            color: '#1A1A1A'
          }}
        >
          Seuil
        </h1>

        <div style={{ width: '80px' }} />
      </div>

      {/* Layout principal : 2 colonnes */}
      <div 
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 'clamp(40px, 5vw, 80px)',
          alignItems: 'start'
        }}
        className="formes-layout"
      >
        {/* Colonne gauche — Visuel */}
        <div 
          style={{
            position: 'sticky',
            top: '80px',
            aspectRatio: '4 / 5',
            background: '#E7E1D8',
            border: '1px solid #DBD4C6',
            overflow: 'hidden'
          }}
        >
          <img 
            src="https://images.unsplash.com/photo-1549144511-f099e773c147?w=800"
            alt="Paris seuil porte"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Colonne droite — Contenu */}
        <div style={{ paddingBottom: '120px' }}>
          {/* Sous-titre */}
          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: '32px'
            }}
          >
            Espace de transition, filtre social, épaisseur symbolique
          </div>

          {/* Introduction */}
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
            Le seuil n'est pas une ligne.{'\n'}
            C'est une zone où l'on change d'état : entrer, sortir, attendre, être vu, être autorisé.{'\n'}
            Toute ville est faite de seuils plus que de murs.
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
                Le seuil est l'espace de transition entre deux régimes : public / privé, profane / sacré, dehors / dedans.
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
                Contrairement au mur qui sépare, le seuil articule. Il ralentit, filtre, prépare, autorise ou refuse. En architecture, le seuil possède une épaisseur : porte, porche, cour, galerie, sas. À Paris, il structure les rapports sociaux autant que les circulations.
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

          {/* Exemples Paris */}
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
                    {exemple.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anecdotes */}
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
              Anecdotes
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ANECDOTES.map((anecdote, i) => (
                <div 
                  key={i}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: '#1A1A1A',
                    opacity: 0.6,
                    paddingLeft: '16px',
                    borderLeft: '1px solid rgba(26, 26, 26, 0.1)'
                  }}
                >
                  {anecdote}
                </div>
              ))}
            </div>
          </div>

          {/* Exercices */}
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
              Exercices pratiques
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {EXERCICES.map((exercice, i) => (
                <div 
                  key={i}
                  style={{
                    background: 'rgba(0, 61, 44, 0.03)',
                    border: '1px solid rgba(0, 61, 44, 0.15)',
                    padding: '24px'
                  }}
                >
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#003D2C',
                      marginBottom: '12px'
                    }}
                  >
                    Exercice {i + 1} — {exercice.titre}
                  </div>
                  <p 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: '#1A1A1A',
                      opacity: 0.7,
                      marginBottom: '12px'
                    }}
                  >
                    {exercice.consigne}
                  </p>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '11px',
                      color: '#1A1A1A',
                      opacity: 0.4
                    }}
                  >
                    Durée : {exercice.duree} · Matériel : {exercice.materiel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Livres */}
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
              Livres recommandés
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {LIVRES.map((livre, i) => (
                <div 
                  key={i}
                  style={{
                    borderLeft: '1px solid rgba(26, 26, 26, 0.15)',
                    paddingLeft: '20px'
                  }}
                >
                  <div 
                    style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#1A1A1A',
                      marginBottom: '4px'
                    }}
                  >
                    {livre.auteur} — <span style={{ fontStyle: 'italic' }}>{livre.titre}</span>
                  </div>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: '#1A1A1A',
                      opacity: 0.6
                    }}
                  >
                    {livre.pourquoi}
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
              Accélération 90s
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
              Micro-quiz (6 questions)
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
