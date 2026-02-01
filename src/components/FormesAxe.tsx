/**
 * FORMES — CARTE AXE
 * Architecture de la ligne, outil de regard, outil d'État
 */

import { useState } from 'react';

interface FormesAxeProps {
  onReturn: () => void;
}

interface Type {
  titre: string;
  description: string;
  usage: string;
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
  explication: string;
}

interface Livre {
  auteur: string;
  titre: string;
  pourquoi: string;
}

const REPERES = [
  {
    periode: 'XVIIe siècle',
    titre: 'Le Nôtre et la perspective',
    texte: 'La perspective devient un outil de composition : la ligne ordonne jardin, palais, horizon.'
  },
  {
    periode: '1799–1830',
    titre: 'Paris moderne : passages, flux, visibilité',
    texte: 'La ville commence à "mettre en scène" la circulation et le regard.'
  },
  {
    periode: '1853–1870',
    titre: 'Haussmann : l\'axe comme système',
    texte: 'Percées rectilignes : lumière, air, circulation… et contrôle.'
  },
  {
    periode: '1836',
    titre: 'Concorde : pivot d\'axes',
    texte: 'L\'obélisque devient articulation symbolique et géométrique.'
  },
  {
    periode: '1989',
    titre: 'La Défense : clôture/décalage',
    texte: 'La Grande Arche prolonge l\'axe historique mais ne l\'aligne pas parfaitement : modernité = pivot.'
  }
];

const TYPES: Type[] = [
  {
    titre: 'Axe monumental (perspective de pouvoir)',
    description: 'Ligne longue, lisible, ponctuée de monuments.',
    usage: 'Instaurer une continuité, produire un récit, cadrer l\'horizon.'
  },
  {
    titre: 'Axe fonctionnel (hygiène, circulation, efficacité)',
    description: 'Percée urbaine qui transforme la ville en réseau.',
    usage: 'Faire circuler, ventiler, relier gares, centres, flux.'
  },
  {
    titre: 'Axe civique (lieux de rassemblement)',
    description: 'Suite de places reliées plus que "ligne parfaite".',
    usage: 'Accueillir la foule, la contestation, la mémoire publique.'
  }
];

const EXEMPLES: Exemple[] = [
  {
    nom: 'Axe Louvre → Tuileries → Concorde → Champs-Élysées → Étoile → La Défense (1er/8e/92)',
    description: 'Le récit de l\'État en perspective.'
  },
  {
    nom: 'Concorde : Madeleine ↔ Palais Bourbon (8e/7e)',
    description: 'Axe perpendiculaire : institutions, rites, pouvoir visible.'
  },
  {
    nom: 'Boulevard de Sébastopol (1er/2e/3e/4e)',
    description: 'Percée haussmannienne : flux + ordre + lumière.'
  },
  {
    nom: 'Boulevard Saint-Michel (5e/6e)',
    description: 'Prolongement sud : même logique de traversée.'
  },
  {
    nom: 'Rue de Rivoli prolongée (1er/4e)',
    description: 'Axe est-ouest : continuité urbaine, façade-règle.'
  },
  {
    nom: 'Bastille → République → Nation (11e/10e/12e)',
    description: 'Axe civique de la manifestation et de la mémoire politique.'
  },
  {
    nom: 'Esplanade des Invalides / Pont Alexandre III (7e/8e)',
    description: 'Axe cérémoniel : mise en scène nationale.'
  },
  {
    nom: 'Jardin du Luxembourg (axe intérieur) (6e)',
    description: 'L\'axe se miniaturise : lecture, marche, symétrie.'
  }
];

const ANECDOTES = [
  'Un axe "parfait" est souvent une suite de corrections : l\'alignement est parfois optique, pas géométrique.',
  'À Haussmann, l\'axe sert aussi à faire entrer la troupe et à empêcher les barricades dans les ruelles.',
  'Concorde fonctionne comme une charnière : l\'obélisque stabilise plusieurs récits en un point.',
  'La Défense prolonge l\'axe historique mais la modernité accepte le décalage technique (contraintes souterraines).',
  'L\'axe civique Bastille–Nation n\'est pas "royal" : il est fait pour la foule plus que pour la perspective.',
  'L\'axe est une forme qui transforme la ville en théâtre : le regard est dirigé avant même le corps.'
];

const EXERCICES: Exercice[] = [
  {
    titre: 'Trouver l\'axe',
    consigne: 'Place-toi à un point haut (pont, place, perspective). Repère la ligne qui attire ton regard. Note ce qui la "cadre".',
    duree: '12 min',
    materiel: 'notes'
  },
  {
    titre: 'Dessiner l\'axe',
    consigne: 'Trace une ligne centrale, puis ajoute 3 éléments qui la stabilisent : bordures, répétitions, butée.',
    duree: '10 min',
    materiel: 'crayon'
  },
  {
    titre: 'Butée / Pivot',
    consigne: 'Marche 8 minutes le long d\'un axe. Identifie : (a) une butée, (b) un pivot, (c) un accident.',
    duree: '15 min',
    materiel: 'aucun'
  }
];

const QUESTIONS: Question[] = [
  {
    question: 'Un axe sert d\'abord à :',
    options: ['Décorer une façade', 'Orienter le regard et l\'espace', 'Remplacer une place'],
    reponse: 'Orienter le regard et l\'espace',
    explication: 'L\'axe est une structure de lecture'
  },
  {
    question: 'Haussmann utilise l\'axe surtout pour :',
    options: ['Faire joli', 'Romantiser la ville', 'Circuler, ventiler, contrôler'],
    reponse: 'Circuler, ventiler, contrôler',
    explication: 'L\'axe est un outil fonctionnel et politique'
  },
  {
    question: 'Un axe civique, c\'est plutôt :',
    options: ['Une suite de places', 'Un vitrail', 'Une arche'],
    reponse: 'Une suite de places',
    explication: 'L\'axe civique accueille la foule'
  },
  {
    question: 'Une "butée", c\'est :',
    options: ['Une rue en pente', 'Un point qui arrête le regard', 'Une colonne'],
    reponse: 'Un point qui arrête le regard',
    explication: 'La butée termine la perspective'
  },
  {
    question: 'Un "pivot" dans la ville, c\'est :',
    options: ['Un carrefour qui redistribue les directions', 'Une porte cochère', 'Un escalier'],
    reponse: 'Un carrefour qui redistribue les directions',
    explication: 'Le pivot articule plusieurs axes'
  },
  {
    question: 'Vrai/Faux : un axe est toujours parfaitement rectiligne.',
    options: ['Vrai', 'Faux', 'Ça dépend de la météo'],
    reponse: 'Faux',
    explication: 'Souvent rectiligne, rarement "parfait"'
  }
];

const LIVRES: Livre[] = [
  {
    auteur: 'Françoise Choay',
    titre: 'L\'Urbanisme, utopies et réalités',
    pourquoi: 'Comprendre la logique des percées et des doctrines urbaines.'
  },
  {
    auteur: 'Walter Benjamin',
    titre: 'Paris, capitale du XIXe siècle (Passages)',
    pourquoi: 'Seuils/flux/modernité, lecture fine du tissu parisien.'
  },
  {
    auteur: 'Le Corbusier',
    titre: 'Urbanisme',
    pourquoi: 'Utile pour lire la croyance moderne dans la ligne, la grille, le plan.'
  }
];

const TEXTE_ACCELERATION = `Un axe commence souvent avant la rue.
Il commence dans l'œil.

Tu crois marcher dans Paris.
Mais parfois, tu es déjà dans une ligne :
une intention qui te précède.

L'axe simplifie.
Il coupe.
Il aligne.
Il hiérarchise.

C'est une géométrie qui fait croire à l'évidence :
"tout mène ici".
Alors que tout a été construit pour mener là.

Dans les jardins classiques, l'axe est un instrument calme :
il ouvre l'horizon, il impose une mesure.
Puis la ville s'en empare.

Avec Haussmann, la ligne devient réseau :
on perce, on élargit, on ventile.
La ville respire, oui.
Mais elle devient aussi lisible, traversable, maîtrisable.

Un axe n'est jamais neutre.
Il raconte ce qu'un régime veut montrer :
un monument, une administration, une place.
Il produit une mise en scène :
le regard accélère avant le corps.

Et pourtant, l'axe n'est pas seulement pouvoir.
Il peut devenir civique :
une suite de places où la foule se rassemble,
où la mémoire revient,
où la ville parle.

Regarde :
butées, pivots, décalages.
Même la ligne la plus longue contient des accidents.
C'est là que l'architecture cesse d'être un plan
et redevient une expérience.

Quand tu repères un axe,
tu ne "sais" pas plus.
Tu vois mieux.`;

export function FormesAxe({ onReturn }: FormesAxeProps) {
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
              L'axe est partout.{'\n'}
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
              Retour à Axe
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
          Axe
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
            src="https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800"
            alt="Paris axe perspective"
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
            Architecture de la ligne, outil de regard, outil d'État
          </div>

          {/* Intro */}
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(20px, 2.5vw, 28px)',
              fontWeight: 400,
              lineHeight: 1.5,
              fontStyle: 'italic',
              color: '#1A1A1A',
              marginBottom: '80px',
              opacity: 0.7
            }}
          >
            L'axe n'est pas une rue. C'est une intention devenue pierre. Une ligne qui organise le regard, hiérarchise l'espace, et met la ville en mouvement.
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

            <p 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                lineHeight: 1.7,
                color: '#1A1A1A',
                marginBottom: '16px'
              }}
            >
              Un axe est une ligne directrice (réelle ou implicite) qui oriente la ville : il structure des parcours, crée des perspectives, et installe une hiérarchie entre les lieux.
            </p>

            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#1A1A1A',
                opacity: 0.5,
                fontStyle: 'italic'
              }}
            >
              Synonymes : perspective · alignement · percée
            </div>
          </div>

          {/* Repères */}
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
              Repères
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {REPERES.map((repere, i) => (
                <div 
                  key={i}
                  style={{
                    borderLeft: '1px solid rgba(26, 26, 26, 0.15)',
                    paddingLeft: '20px'
                  }}
                >
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#003D2C',
                      marginBottom: '8px'
                    }}
                  >
                    {repere.periode} — {repere.titre}
                  </div>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#1A1A1A',
                      opacity: 0.7
                    }}
                  >
                    {repere.texte}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Types */}
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
              Types
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {TYPES.map((type, i) => (
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
                      marginBottom: '12px'
                    }}
                  >
                    {type.titre}
                  </div>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#1A1A1A',
                      opacity: 0.7,
                      marginBottom: '12px'
                    }}
                  >
                    {type.description}
                  </div>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: '#003D2C',
                      fontStyle: 'italic'
                    }}
                  >
                    → {type.usage}
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
              Exercices
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
              Pour aller plus loin
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