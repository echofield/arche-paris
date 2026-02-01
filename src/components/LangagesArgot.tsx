/**
 * LANGAGES — CARTE ARGOT
 * Cacher · Transmettre · Survivre
 */

import { useState } from 'react';

interface LangagesArgotProps {
  onReturn: () => void;
  onTest: () => void;
}

const PRINCIPE = `L'argot n'est pas une dégénérescence du français. C'est une arme de défense. Dès le XVe siècle, le procès des Coquillards révèle un "langaige exquiz" pour cacher les opérations criminelles aux "duppes" (les naïfs) et aux "bourres" (la police). Pendant que les salons épurent, les bas-fonds cryptent. Le Louchébem des bouchers, le jargon des voleurs, le verlan des soldats : chaque groupe fabrique sa contre-norme. Vidocq trahit le code en 1828, l'argot entre dans le roman-feuilleton (Les Mystères de Paris, 1842), puis dans la chanson (Piaf). Ce qui était secret devient spectacle. Mais la fonction reste : résister à la norme par le langage.`;

const JALONS = [
  {
    periode: '1455',
    titre: 'Procès des Coquillards : Naissance officielle',
    texte: 'À Dijon, le procureur révèle l\'existence d\'une bande organisée utilisant un "langaige exquiz" pour se coordonner sans être compris. Les membres portent des surnoms (Colin le Breton, Perrenet le Fournier). François Villon, poète maudit, utilise ce jargon dans ses Ballades, faisant entrer pour la première fois la langue des gueux dans la haute littérature. C\'est du cryptage professionnel, pas du jeu.'
  },
  {
    periode: 'XVIe-XVIIe siècles',
    titre: 'Le Royaume d\'Argot et la Cour des Miracles',
    texte: 'La mythologie urbaine parisienne décrit une contre-société : le "Royaume d\'Argot" avec son roi (le Grand Coësre), ses ducs, ses lois. Bien que romancée (notamment par Hugo), elle repose sur une réalité : l\'existence d\'un lexique de la survie et de l\'exclusion. Le jargon (ou jobelin) sert de passeport. Il identifie l\'appartenance au groupe (les "aminches") et exclut les mouchards. C\'est une anti-Académie.'
  },
  {
    periode: '1828',
    titre: 'Vidocq : La trahison du code',
    texte: 'Eugène-François Vidocq, ancien bagnard devenu chef de la Sûreté, publie ses Mémoires et son dictionnaire Les Voleurs. Il livre les clés du code secret au grand public. Il est haï de la pègre pour avoir "vendu la mèche", mais son ouvrage devient le manuel de référence des romanciers (Balzac, Hugo) et des policiers. L\'argot sort de la rue pour entrer dans le livre. Il passe d\'outil de défense à objet de curiosité littéraire.'
  },
  {
    periode: '1842',
    titre: 'Les Mystères de Paris : Explosion bourgeoise',
    texte: 'Eugène Sue publie en feuilleton Les Mystères de Paris. Il utilise massivement l\'argot (chouriner, suriner, thune) avec des notes de bas de page pour traduire aux lecteurs bourgeois. Le succès est immense. Les salons s\'encanaillent en toute sécurité. Mais la critique puriste crie au scandale : Sainte-Beuve et Gautier dénoncent cette "pustule", cette "excroissance hideuse" de la langue. L\'argot devient un champ de bataille culturel.'
  }
];

const MECANISMES = [
  {
    nom: 'Le Louchébem (Bouchers)',
    description: 'Argot à clé : consonne initiale déplacée à la fin, remplacée par "L", suffixe ajouté. "Boucher" → Louchébem. "Fou" → Loufoque (passé dans le langage courant). "En douce" → En loucedé. Fonction : parler devant le client sans être compris, crypter les prix, commenter discrètement. C\'est un outil commercial et social des Halles et de la Villette.'
  },
  {
    nom: 'Le Verlan (Ancien)',
    description: 'Contrairement au mythe, le verlan n\'est pas une invention des banlieues des années 80. Au XVIIe siècle, les pamphlets de la Fronde utilisaient "Bonbours" pour Bourbons (pour éviter la censure). Pendant la Première Guerre mondiale, les soldats parisiens cryptaient les noms de lieux : "Nudver" pour Verdun, "Ellivelleb" pour Belleville. Le verlan est une constante cryptologique de la langue populaire parisienne.'
  },
  {
    nom: 'La Métaphore Corporelle',
    description: 'Le corps est déconstruit et renommé par analogie avec des objets du quotidien ou de la nourriture. La tête devient "le ciboulot" (ciboulette), "la cafetière", "le citron". Les mains sont "les grappins", "les pognes". Les jambes sont "les quilles", "les flûtes" (d\'où "jouer des flûtes" pour s\'enfuir). C\'est une vision du monde physique, violente et ironique, obsédée par la survie.'
  }
];

const QUIZ_QUESTIONS = [
  {
    question: 'Quelle est la fonction première de l\'argot ancien (Coquillards, XVe siècle) ?',
    options: [
      'Faire rire les bourgeois',
      'Crypter la communication pour ne pas être compris des "duppes" (naïfs) et des "bourres" (police)',
      'Créer une nouvelle langue académique',
      'Remplacer le latin'
    ],
    correct: 1,
    explication: 'L\'argot naît comme outil de défense et de cryptage. Le procès des Coquillards (1455) révèle un "langaige exquiz" pour coordonner les activités criminelles sans être compris. C\'est du cryptage professionnel, pas un jeu linguistique.'
  },
  {
    question: 'Pourquoi Vidocq est-il haï de la pègre parisienne après 1828 ?',
    options: [
      'Parce qu\'il a arrêté trop de voleurs',
      'Parce qu\'il a publié un dictionnaire de l\'argot, livrant les clés du code secret au grand public',
      'Parce qu\'il était trop violent',
      'Parce qu\'il a écrit des romans'
    ],
    correct: 1,
    explication: 'Vidocq, ancien bagnard devenu chef de la Sûreté, a "vendu la mèche" en publiant Les Voleurs (1828), un dictionnaire de l\'argot. Il a brisé le code du secret. Son ouvrage devient le manuel de référence des romanciers (Balzac, Hugo) et des policiers pour décrypter les messages interceptés.'
  },
  {
    question: 'Le verlan est-il une invention des banlieues des années 1980 ?',
    options: [
      'Oui, c\'est une création récente',
      'Non, il existe depuis au moins le XVIIe siècle (ex: "Bonbours" pour Bourbons)',
      'Oui, c\'est une influence américaine',
      'Non, c\'est une invention du Moyen Âge'
    ],
    correct: 1,
    explication: 'Le verlan est une pratique parisienne séculaire. Au XVIIe siècle, les pamphlets de la Fronde utilisaient "Bonbours" pour les Bourbons. Pendant la Grande Guerre, les soldats cryptaient les lieux : "Nudver" (Verdun), "Ellivelleb" (Belleville). C\'est une constante cryptologique, pas une mode récente.'
  },
  {
    question: 'Pourquoi la publication des Mystères de Paris (1842) fait-elle scandale ?',
    options: [
      'Parce que le livre est trop long',
      'Parce qu\'il introduit massivement l\'argot des bas-fonds dans les salons bourgeois',
      'Parce qu\'il critique le roi',
      'Parce qu\'il est mal écrit'
    ],
    correct: 1,
    explication: 'Eugène Sue utilise massivement l\'argot (chouriner, suriner, thune) avec des notes de bas de page. Le succès est immense : les bourgeois s\'encanaillent en toute sécurité. Mais les puristes (Sainte-Beuve, Gautier) dénoncent cette "pustule", cette invasion de la langue "sale" dans la littérature légitime.'
  },
  {
    question: 'Quelle est la fonction du Louchébem pour les bouchers des Halles ?',
    options: [
      'Impressionner les clients',
      'Parler devant le client sans être compris, crypter les prix, commenter discrètement',
      'Apprendre le latin',
      'Faire de la poésie'
    ],
    correct: 1,
    explication: 'Le Louchébem est un argot à clé (consonne initiale déplacée + préfixe "L" + suffixe). Il servait aux bouchers des Halles et de la Villette à communiquer entre eux devant la clientèle : commenter la qualité de la viande, discuter les prix, parler des clients sans être compris. C\'est un outil de connivence commerciale et sociale.'
  }
];

export function LangagesArgot({ onReturn, onTest }: LangagesArgotProps) {
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
              L'argot n'est pas une dégénérescence.
              <br/><br/>
              C'est une architecture parallèle,
              <br/>
              une contre-norme,
              <br/>
              une résistance par le langage.
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
            Argot
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
            Cacher · Transmettre · Survivre
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

          {/* Mécanismes */}
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
              Mécanismes de Cryptage
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {MECANISMES.map((mecanisme, i) => (
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
                    {mecanisme.nom}
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
                    {mecanisme.description}
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
