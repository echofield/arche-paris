/**
 * LANGAGES — TEST
 * 12 questions · Pas de score visible · Fin élégante
 */

import { useState } from 'react';

interface LangagesTestProps {
  onReturn: () => void;
}

interface Question {
  phrase: string;
  reponses: string[];
  correcte: string;
}

const QUESTIONS: Question[] = [
  {
    phrase: '"J\'ai plus une thune."',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Rue'
  },
  {
    phrase: '"Bon usage"',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Salon'
  },
  {
    phrase: '"Piger" (comprendre)',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Argot'
  },
  {
    phrase: '"Persifler"',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Salon'
  },
  {
    phrase: '"En charrette"',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Rue'
  },
  {
    phrase: '"Loufoque" (vient du Louchébem)',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Argot'
  },
  {
    phrase: '"Urbanité"',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Salon'
  },
  {
    phrase: '"Daron" (père / chef)',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Argot'
  },
  {
    phrase: '"Poulets" (police)',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Rue'
  },
  {
    phrase: '"Dictionnaire"',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Salon'
  },
  {
    phrase: '"Se coltiner" (porter / subir)',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Argot'
  },
  {
    phrase: '"S\'encanailler"',
    reponses: ['Rue', 'Salon', 'Argot'],
    correcte: 'Salon'
  }
];

export function LangagesTest({ onReturn }: LangagesTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reponses, setReponses] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const handleReponse = (reponse: string) => {
    const newReponses = [...reponses, reponse];
    setReponses(newReponses);

    if (currentQuestion < QUESTIONS.length - 1) {
      // Passer à la question suivante
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 400);
    } else {
      // Finir le test
      setTimeout(() => {
        setIsFinished(true);
      }, 400);
    }
  };

  // Écran de fin
  if (isFinished) {
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
              color: '#1A1A1A',
              marginBottom: '64px',
              whiteSpace: 'pre-line'
            }}
          >
            Tu n'as rien "gagné".{'\n'}
            Tu as juste appris à reconnaître une couche.
          </div>

          <button
            onClick={onReturn}
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
            Retour à Langages
          </button>
        </div>
      </div>
    );
  }

  // Questions
  const question = QUESTIONS[currentQuestion];

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
          maxWidth: '800px',
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
      <div 
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '64px'
        }}
      >
        {/* Phrase */}
        <div 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 400,
            lineHeight: 1.4,
            color: '#1A1A1A',
            textAlign: 'center',
            padding: '40px'
          }}
        >
          {question.phrase}
        </div>

        {/* Instruction */}
        <div 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#1A1A1A',
            opacity: 0.4,
            marginBottom: '16px'
          }}
        >
          Quel registre ?
        </div>

        {/* Réponses */}
        <div 
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {question.reponses.map((reponse, i) => (
            <button
              key={i}
              onClick={() => handleReponse(reponse)}
              style={{
                background: 'transparent',
                border: '0.5px solid rgba(26, 26, 26, 0.15)',
                padding: '24px 48px',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '24px',
                fontWeight: 400,
                color: '#1A1A1A',
                cursor: 'pointer',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: '180px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(26, 26, 26, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.15)';
              }}
            >
              {reponse}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}