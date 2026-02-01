/**
 * LANGAGES — CARTE ORIGINE
 * Stratification · Géographie · Cryptage
 */

import { useState } from 'react';

interface LangagesOrigineProps {
  onReturn: () => void;
  onTest: () => void;
}

const PRINCIPE = `Paris n'a jamais parlé qu'une seule langue. Entre 1850 et 1970, chaque arrondissement, chaque métier, chaque strate sociale a forgé son propre vernaculaire. L'argot n'est pas un accident : c'est une architecture verbale stratifiée, cryptique et identitaire. Cette carte observe comment la ville a encodé sa résistance dans le langage.`;

const JALONS = [
  {
    periode: '1850–1880',
    titre: 'Les Halles : Louchébem et corporations',
    texte: 'Les bouchers codifient le premier dialecte structuré de Paris. Le Louchébem permet de parler devant le client sans être compris. "Boucher" devient "Louchébem", "Fou" devient "Loufoque". C\'est un cryptage professionnel qui définit l\'identité du métier.'
  },
  {
    periode: '1880–1920',
    titre: 'Montmartre : L\'argot s\'embourgeoise',
    texte: 'Avec Aristide Bruant au Chat Noir, l\'argot monte sur scène. Il n\'est plus seulement l\'outil du voleur ou du boucher : il devient spectacle. Les bourgeois viennent s\'encanailler en écoutant la "gouaille" – ce mélange de raillerie, d\'insolence et de résilience.'
  },
  {
    periode: '1900–1930',
    titre: 'Belleville et les Apaches : La terreur lexicale',
    texte: 'Les bandes de l\'Est parisien (Belleville, Ménilmontant) développent un argot de violence. "Surin" (couteau), "Refroidir" (tuer), "Coup du Père François" (étranglement). Le langage est une arme. La presse invente le terme "Apaches" pour désigner cette sauvagerie urbaine.'
  },
  {
    periode: '1930–1970',
    titre: 'Piaf et Gainsbourg : L\'archivage par la chanson',
    texte: 'La chanson réaliste (Piaf, Fréhel, Damia) transforme l\'argot en patrimoine émotionnel. Gainsbourg, plus tard, en fait un jeu esthétique avec le Javanais et les doubles sens. L\'argot passe du trottoir à la culture pop, puis commence à mourir, remplacé par les parlers de cité.'
  }
];

const EXEMPLES = [
  {
    nom: 'Le Louchébem (Bouchers des Halles)',
    description: 'Mécanisme : consonne initiale déplacée à la fin, remplacée par "L", suffixe ajouté (-em, -oc, -uche). "Boucher" → Louchébem. "En douce" → En loucedé. "Fou" → Loufoque (passé dans le langage courant). Fonction : parler devant le client, crypter les prix, commenter discrètement.'
  },
  {
    nom: 'La Gouaille de Bruant (Montmartre)',
    description: 'Aristide Bruant codifie l\'argot dans des chansons géolocalisées : "À la Villette", "À la Bastille". Il insulte les bourgeois venus au cabaret avec un lexique imagé : "Marlou" (voyou), "Gigolette" (jeune fille du peuple), "Pimbêche" (dame prétentieuse). L\'argot devient identité culturelle parisienne.'
  },
  {
    nom: 'Le Javanais de Gainsbourg',
    description: 'Code ancien devenu jeu poétique : insertion de "av" entre les syllabes. "J\'avoue j\'en ai bavé" devient "J\'avavoue j\'en avai bavavé" (La Javanaise, 1963). Ce qui était cryptage de rue devient sophistication pop. Gainsbourg fait le pont entre l\'argot ouvrier et la modernité.'
  }
];

const QUIZ_QUESTIONS = [
  {
    question: 'Pourquoi l\'argot parisien est-il d\'abord cryptique avant d\'être identitaire ?',
    options: [
      'Pour impressionner les touristes',
      'Pour dissimuler activités illicites et secrets de métier aux "bourres" (police) et aux bourgeois',
      'Pour créer une nouvelle langue académique',
      'Pour remplacer le français'
    ],
    correct: 1,
    explication: 'L\'argot remplit une double fonction : cryptique (cacher aux autorités) et identitaire (cimenter la cohésion sociale). Les bouchers cachent les prix, les voleurs cachent leurs plans, les ouvriers marquent leur territoire verbal.'
  },
  {
    question: 'Quel mécanisme transforme "Boucher" en "Louchébem" ?',
    options: [
      'Ajout de voyelles aléatoires',
      'Inversion complète du mot',
      'Déplacement de la consonne initiale + préfixe "L" + suffixe "-em"',
      'Traduction en ancien français'
    ],
    correct: 2,
    explication: 'Le Louchébem suit une règle stricte : B (consonne initiale) passe à la fin, remplacée par L, suffixe -em ajouté. Boucher → L-ouche-b-em. C\'est un procédé systématique, pas aléatoire.'
  },
  {
    question: 'Pourquoi Aristide Bruant géolocalise-t-il ses chansons ("À la Villette", "À Belleville") ?',
    options: [
      'Pour faire de la publicité immobilière',
      'Parce que chaque quartier a son propre climat linguistique et social',
      'Pour attirer les touristes dans ces quartiers',
      'Par hasard'
    ],
    correct: 1,
    explication: 'L\'argot de Paris n\'est pas uniforme : c\'est un "terroir" linguistique. La langue du boucher des Halles n\'est pas celle du souteneur de Pigalle, ni celle de l\'ouvrier du Faubourg Saint-Antoine. Bruant documente cette géographie verbale.'
  },
  {
    question: 'Que signifie "Gouaille" ?',
    options: [
      'Un type de poisson parisien',
      'Un quartier de Belleville',
      'Mélange de raillerie, insolence, scepticisme et résilience face à l\'adversité',
      'Un instrument de musique'
    ],
    correct: 2,
    explication: 'La gouaille est intraduisible. C\'est l\'attitude typiquement parisienne : tenir tête au destin par le rire et le mépris, transformer la laideur en chanson. C\'est l\'esprit de Gavroche et d\'Arletty, la voix roulée de Piaf.'
  },
  {
    question: 'Pourquoi l\'argot du Vieux Paris (1850-1970) est-il considéré comme "mort ou moribond" aujourd\'hui ?',
    options: [
      'Il a été interdit par la loi',
      'Plus personne ne parle français',
      'Il a été supplanté par les parlers des cités, influencés par l\'arabe dialectal et l\'anglais',
      'Il était trop compliqué'
    ],
    correct: 2,
    explication: 'L\'argot classique (Piaf, Gainsbourg) sentait "le cuir, le sang, le vin et la sueur" – il était artisanal et local. L\'argot contemporain est mondialisé, emprunte à d\'autres cultures, et répond à d\'autres réalités urbaines. C\'est un changement de strate sociale et culturelle.'
  }
];

export function LangagesOrigine({ onReturn, onTest }: LangagesOrigineProps) {
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
              L'argot n'est pas une dégénérescence du français.
              <br/><br/>
              C'est une architecture parallèle,
              <br/>
              stratifiée par la survie et l'ironie.
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
            Origine
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
            Stratification · Géographie · Cryptage
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
              Mécanismes
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
