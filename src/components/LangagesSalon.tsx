/**
 * LANGAGES — CARTE SALON
 * Norme · Distinction · Fixation
 */

import { useState } from 'react';

interface LangagesSalonProps {
  onReturn: () => void;
  onTest: () => void;
}

const PRINCIPE = `Au XVIIe siècle, une micro-société parisienne confisque la langue. L'Hôtel de Rambouillet, l'Académie française, les salons du Marais : ce ne sont pas des lieux neutres. Ce sont des laboratoires de distinction sociale. On n'y parle pas pour communiquer, on y parle pour exclure. La préciosité, moquée par Molière, invente pourtant les mots de l'analyse psychologique. Vaugelas observe "la plus saine partie de la Cour" et fige ce qui devient la norme. Paris fabrique le "Bon Usage" — et avec lui, la faute.`;

const JALONS = [
  {
    periode: '1608–1650',
    titre: 'Hôtel de Rambouillet : La Chambre bleue',
    texte: 'Catherine de Vivonne ouvre son salon rue Saint-Thomas-du-Louvre. On y invente la "Ruelle" : l\'espace intime entre le lit et le mur où l\'on reçoit. C\'est le prototype du lieu de distinction. On y fuit la vulgarité de la cour d\'Henri IV. Le langage devient outil de sélection : qui parle bien, entre. Qui parle mal, reste dehors.'
  },
  {
    periode: '1635',
    titre: 'Académie française : La langue devient affaire d\'État',
    texte: 'Richelieu institutionnalise un petit cercle privé. Mission officielle (art. XXIV) : "rendre la langue pure, éloquente et capable de traiter les arts et les sciences". La langue parisienne n\'est plus seulement celle de la Cour, elle devient celle de l\'État. L\'Académie mettra 60 ans à produire son premier dictionnaire (1694), mais impose l\'idée qu\'il existe UNE norme.'
  },
  {
    periode: '1647',
    titre: 'Vaugelas : Le Greffier du Bon Usage',
    texte: 'Claude Favre de Vaugelas publie ses Remarques sur la langue françoise. Il ne légifère pas par la raison, il observe : "le Bon Usage est la façon de parler de la plus saine partie de la Cour, conformément à la façon d\'écrire de la plus saine partie des Auteurs". C\'est la norme sociologique pure : la langue correcte est celle de l\'élite. Point. La légende veut qu\'il soit mort en murmurant : "Je m\'en vais ou je m\'en vas... l\'un et l\'autre se dit ou se disent".'
  },
  {
    periode: '1654–1660',
    titre: 'Préciosité : Épurer pour distinguer',
    texte: 'Mademoiselle de Scudéry tient ses "Samedis" rue de Beauce (Marais). Elle publie Clélie avec la fameuse "Carte de Tendre" : une géographie imaginaire des sentiments (Fleuve Inclination, Lac d\'Indifférence, villages de Billet-Doux). Les précieuses éliminent le vocabulaire "bas" (tout ce qui rappelle le corps, la matière). Le miroir devient "le conseiller des grâces", les dents "l\'ameublement de la bouche". Molière se moque (Les Précieuses ridicules, 1659), mais elles ont créé les mots de l\'émotion moderne : féliciter, s\'enthousiasmer, anonyme, incontestable.'
  }
];

const EXEMPLES = [
  {
    nom: 'Les Périphrases Précieuses',
    description: 'Pour éviter le "mot propre" jugé vulgaire ou brutal, on décrit par attributs. "Le conseiller des grâces" (miroir), "l\'ameublement de la bouche" (dents), "les écluses du cerveau" (le nez qui coule). Certaines ont sombré dans le ridicule. D\'autres ont enrichi la langue par leur finesse psychologique. C\'est une hygiène linguistique : débrutaliser la langue pour débrutaliser les mœurs.'
  },
  {
    nom: 'La Prononciation "Chouse"',
    description: 'Au XVIIe siècle, la Cour affectait de fermer les voyelles pour se distinguer du peuple parisien qui les ouvrait. On disait "chouse" pour "chose", "arrouser" pour "arroser". Les grammairiens ont validé temporairement ce tic aristocratique. C\'est le marqueur de classe immédiat : à l\'oreille, on sait instantanément qui appartient à quel monde.'
  },
  {
    nom: 'La Guerre du "Car"',
    description: 'Querelle ridicule mais révélatrice : certains puristes comme Gomberville voulaient bannir la conjonction "car", jugée laide, basse ou archaïque. Vincent Voiture, habitué de Rambouillet, dut écrire une lettre pour défendre ce petit mot et sauver la causalité française. La norme n\'est jamais neutre : c\'est un champ de bataille permanent où chaque mot est une victoire ou une défaite.'
  }
];

const QUIZ_QUESTIONS = [
  {
    question: 'Qu\'est-ce que la "Ruelle" dans le contexte des salons du XVIIe siècle ?',
    options: [
      'Une petite rue de Paris',
      'L\'espace intime entre le lit et le mur de la chambre à coucher où l\'on recevait les intimes',
      'Un salon de thé',
      'Un type de danse'
    ],
    correct: 1,
    explication: 'La "Ruelle" est le nom donné à l\'espace entre le lit et le mur dans la chambre aristocratique. C\'est là que les précieuses recevaient leurs invités, créant un lieu de sociabilité intime et sélectif, berceau de la conversation mondaine.'
  },
  {
    question: 'Selon Vaugelas (1647), qu\'est-ce que le "Bon Usage" ?',
    options: [
      'Ce qui est logique grammaticalement',
      'La façon de parler de la plus saine partie de la Cour + la façon d\'écrire de la plus saine partie des Auteurs',
      'Ce que dit le dictionnaire',
      'La langue du peuple de Paris'
    ],
    correct: 1,
    explication: 'Vaugelas ne légifère pas par la logique, il observe l\'élite. Le Bon Usage est une norme sociologique : c\'est ce que dit et écrit "la plus saine partie" (= la plus prestigieuse) de la Cour et des Auteurs. C\'est la consécration de la langue comme marqueur de classe.'
  },
  {
    question: 'Qu\'est-ce que la "Carte de Tendre" inventée par Mlle de Scudéry ?',
    options: [
      'Un plan de Paris',
      'Une géographie imaginaire des sentiments amoureux avec des villages symboliques',
      'Un jeu de cartes',
      'Une carte géologique'
    ],
    correct: 1,
    explication: 'Publiée dans Clélie (1654), la Carte de Tendre est une géographie allégorique : Fleuve Inclination, Lac d\'Indifférence, villages de Billet-Doux, Petits-Soins, etc. Elle spatialise et analyse finement la psychologie amoureuse. C\'est l\'outil linguistique des précieuses pour raffiner le langage des sentiments.'
  },
  {
    question: 'Pourquoi la préciosité élimine-t-elle le vocabulaire "bas" ou corporel ?',
    options: [
      'Par pudeur religieuse',
      'Pour débrutaliser la langue et les mœurs, créant une barrière sociale par le langage',
      'Parce que c\'est interdit par la loi',
      'Par hasard'
    ],
    correct: 1,
    explication: 'La préciosité porte un projet esthétique ET social : en épurant la langue (éliminer "cul", "poitrine", tout ce qui rappelle la fonction animale), on épure les mœurs. C\'est aussi un mécanisme de distinction : qui maîtrise ce code raffiné appartient à l\'élite. Qui ne le maîtrise pas est exclu.'
  },
  {
    question: 'Pourquoi l\'Académie française met-elle 60 ans (1635-1694) à publier son premier dictionnaire ?',
    options: [
      'Parce qu\'ils étaient paresseux',
      'Parce que fixer la langue est un travail lent, politique et conflictuel',
      'Parce qu\'il n\'y avait pas d\'imprimeurs',
      'Parce qu\'ils ont oublié'
    ],
    correct: 1,
    explication: 'Fixer la langue n\'est pas un geste technique, c\'est un acte de pouvoir. Chaque choix (orthographe, définition, inclusion/exclusion d\'un mot) crée une norme et des exclus. L\'Académie avance lentement car elle tranche des guerres idéologiques et sociales à chaque mot. Ce n\'est pas un retard, c\'est la preuve que la langue est un champ de bataille.'
  }
];

export function LangagesSalon({ onReturn, onTest }: LangagesSalonProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Quiz flow
  if (showQuiz) {
    const question = QUIZ_QUESTIONS[currentQuestion];
    const isCorrect = selectedAnswer === question.options[question.correct];

    if (quizFinished) {
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
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div 
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '32px',
                fontWeight: 400,
                lineHeight: 1.4,
                color: '#1A1A1A',
                marginBottom: '40px'
              }}
            >
              La norme n'est jamais neutre.
              <br/><br/>
              Elle fabrique un centre et une périphérie,
              <br/>
              un dedans et un dehors.
              <br/><br/>
              Paris a dicté comment parler pour appartenir.
            </div>

            <button
              onClick={() => setShowQuiz(false)}
              style={{
                background: 'transparent',
                border: '0.5px solid rgba(0, 61, 44, 0.2)',
                padding: '16px 32px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#003D2C',
                cursor: 'pointer',
                transition: 'all 400ms ease',
                marginRight: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.2)';
              }}
            >
              Retour à la carte
            </button>

            <button
              onClick={onTest}
              style={{
                background: '#003D2C',
                border: 'none',
                padding: '16px 32px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#FAF8F2',
                cursor: 'pointer',
                transition: 'all 400ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Test final →
            </button>
          </div>
        </div>
      );
    }

    return (
      <div 
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          padding: '80px 40px'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Progress */}
          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.3,
              marginBottom: '40px',
              textAlign: 'center'
            }}
          >
            Question {currentQuestion + 1} / {QUIZ_QUESTIONS.length}
          </div>

          {/* Question */}
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '28px',
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#1A1A1A',
              marginBottom: '48px',
              textAlign: 'center'
            }}
          >
            {question.question}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedAnswer(option);
                  setShowExplanation(true);
                }}
                disabled={showExplanation}
                style={{
                  background: selectedAnswer === option 
                    ? (i === question.correct ? 'rgba(0, 61, 44, 0.05)' : 'rgba(200, 0, 0, 0.05)')
                    : 'transparent',
                  border: selectedAnswer === option
                    ? (i === question.correct ? '0.5px solid rgba(0, 61, 44, 0.3)' : '0.5px solid rgba(200, 0, 0, 0.3)')
                    : '0.5px solid rgba(26, 26, 26, 0.15)',
                  padding: '20px 24px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: '#1A1A1A',
                  textAlign: 'left',
                  cursor: showExplanation ? 'default' : 'pointer',
                  transition: 'all 400ms ease'
                }}
                onMouseEnter={(e) => {
                  if (!showExplanation) {
                    e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showExplanation && selectedAnswer !== option) {
                    e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.15)';
                  }
                }}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div 
              style={{
                background: 'rgba(0, 61, 44, 0.03)',
                border: '0.5px solid rgba(0, 61, 44, 0.15)',
                padding: '32px',
                marginBottom: '40px'
              }}
            >
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: isCorrect ? '#003D2C' : '#8B0000',
                  marginBottom: '16px'
                }}
              >
                {isCorrect ? 'Correct' : 'Incorrect'}
              </div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: 1.8,
                  color: '#1A1A1A'
                }}
              >
                {question.explication}
              </div>
            </div>
          )}

          {/* Navigation */}
          {showExplanation && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  } else {
                    setQuizFinished(true);
                  }
                }}
                style={{
                  background: '#003D2C',
                  border: 'none',
                  padding: '16px 48px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#FAF8F2',
                  cursor: 'pointer',
                  transition: 'all 400ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.85';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {currentQuestion < QUIZ_QUESTIONS.length - 1 ? 'Suivant →' : 'Terminer'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main card view
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 80px)'
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            transition: 'opacity 400ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
        >
          ← Retour
        </button>

        <button
          onClick={() => setShowQuiz(true)}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(0, 61, 44, 0.2)',
            padding: '12px 24px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#003D2C',
            cursor: 'pointer',
            transition: 'all 400ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.2)';
          }}
        >
          Quiz →
        </button>
      </div>

      {/* Content grid */}
      <div 
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 'clamp(40px, 5vw, 80px)',
          alignItems: 'start'
        }}
      >
        {/* Left: Title + Principle */}
        <div>
          <h1 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(48px, 6vw, 72px)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: '#1A1A1A',
              marginBottom: '40px'
            }}
          >
            Salon
          </h1>

          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.4,
              marginBottom: '32px'
            }}
          >
            Norme · Distinction · Fixation
          </div>

          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              marginBottom: '64px'
            }}
          >
            {PRINCIPE}
          </div>

          {/* Exemples */}
          <div>
            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4,
                marginBottom: '24px'
              }}
            >
              Mécanismes de Distinction
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {EXEMPLES.map((exemple, i) => (
                <div key={i}>
                  <div 
                    style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: '18px',
                      fontWeight: 400,
                      lineHeight: 1.4,
                      color: '#1A1A1A',
                      marginBottom: '12px'
                    }}
                  >
                    {exemple.nom}
                  </div>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: 400,
                      lineHeight: 1.8,
                      color: '#1A1A1A',
                      opacity: 0.7
                    }}
                  >
                    {exemple.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Timeline */}
        <div>
          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.4,
              marginBottom: '32px'
            }}
          >
            Jalons Historiques
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {JALONS.map((jalon, i) => (
              <div 
                key={i}
                style={{
                  borderLeft: '0.5px solid rgba(26, 26, 26, 0.15)',
                  paddingLeft: '32px',
                  position: 'relative'
                }}
              >
                {/* Dot */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '-4px',
                    top: '6px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#1A1A1A'
                  }}
                />

                {/* Period */}
                <div 
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    color: '#1A1A1A',
                    opacity: 0.5,
                    marginBottom: '8px'
                  }}
                >
                  {jalon.periode}
                </div>

                {/* Title */}
                <div 
                  style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: '20px',
                    fontWeight: 400,
                    lineHeight: 1.3,
                    color: '#1A1A1A',
                    marginBottom: '12px'
                  }}
                >
                  {jalon.titre}
                </div>

                {/* Text */}
                <div 
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: 1.8,
                    color: '#1A1A1A',
                    opacity: 0.7
                  }}
                >
                  {jalon.texte}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
