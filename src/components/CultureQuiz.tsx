/**
 * ARCHÉ — Culture Quiz
 *
 * Ignition layer: dopamine autorisée.
 * Fast tempo → puis retour au calme.
 *
 * "Je vais te réveiller... puis je te laisse marcher."
 */

import { useState, useEffect, useCallback } from 'react';
import {
  QUIZ_QUESTIONS,
  getRandomQuestions,
  LEVELS,
  type QuizQuestion
} from '../data/quiz-questions';
import { useTranslation } from '../utils/i18n';

type QuizPhase = 'menu' | 'playing' | 'reveal' | 'result';
type GameMode = 'classique' | 'sprint';

interface CultureQuizProps {
  onBack: () => void;
}

export function CultureQuiz({ onBack }: CultureQuizProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<QuizPhase>('menu');
  const [mode, setMode] = useState<GameMode>('classique');
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(false);

  const currentQuestion = questions[currentIndex];
  const levelData = LEVELS[level];

  // Timer logic
  useEffect(() => {
    if (!timerActive || phase !== 'playing') return;

    if (timeLeft <= 0) {
      handleAnswer(null); // Time's up
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, phase]);

  // Start game
  const startGame = useCallback(() => {
    const count = mode === 'classique' ? 10 : 20;
    const selectedQuestions = getRandomQuestions(count, level);
    setQuestions(selectedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTimeLeft(levelData.timer);
    setPhase('playing');
    setTimerActive(true);
  }, [mode, level, levelData.timer]);

  // Handle answer selection
  const handleAnswer = (answer: string | null) => {
    if (selectedAnswer !== null) return; // Already answered

    setTimerActive(false);
    setSelectedAnswer(answer);

    const correct = answer === currentQuestion?.answer;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 1);
    }

    // Show reveal
    setPhase('reveal');
  };

  // Next question
  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('result');
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimeLeft(mode === 'sprint' ? Math.max(5, levelData.timer - currentIndex) : levelData.timer);
      setPhase('playing');
      setTimerActive(true);
    }
  };

  // Reset
  const resetQuiz = () => {
    setPhase('menu');
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  // Menu screen
  if (phase === 'menu') {
    return (
      <div style={styles.container}>
        <button onClick={onBack} style={styles.backButton}>{t('seuil.back')}</button>

        <div style={styles.menuContent}>
          <p style={styles.menuSymbol}>◇</p>
          <h1 style={styles.menuTitle}>{t('seuil.title')}</h1>
          <p style={styles.menuSubtitle}>{t('seuil.subtitle')}</p>

          {/* Level selector */}
          <div style={styles.selector}>
            <p style={styles.selectorLabel}>{t('seuil.menu.level')}</p>
            <div style={styles.levelButtons}>
              {([1, 2, 3, 4, 5] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  style={{
                    ...styles.levelButton,
                    background: level === l ? '#003D2C' : 'transparent',
                    color: level === l ? '#FAF8F2' : '#003D2C'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <p style={styles.levelName}>{levelData.name}</p>
            <p style={styles.levelDesc}>{levelData.timer}{t('seuil.menu.perQuestion')}</p>
          </div>

          {/* Mode selector */}
          <div style={styles.selector}>
            <p style={styles.selectorLabel}>{t('seuil.menu.mode')}</p>
            <div style={styles.modeButtons}>
              <button
                onClick={() => setMode('classique')}
                style={{
                  ...styles.modeButton,
                  background: mode === 'classique' ? '#003D2C' : 'transparent',
                  color: mode === 'classique' ? '#FAF8F2' : '#003D2C'
                }}
              >
                {t('seuil.mode.classique')}
                <span style={styles.modeDesc}>{t('seuil.mode.classique.desc')}</span>
              </button>
              <button
                onClick={() => setMode('sprint')}
                style={{
                  ...styles.modeButton,
                  background: mode === 'sprint' ? '#003D2C' : 'transparent',
                  color: mode === 'sprint' ? '#FAF8F2' : '#003D2C'
                }}
              >
                {t('seuil.mode.sprint')}
                <span style={styles.modeDesc}>{t('seuil.mode.sprint.desc')}</span>
              </button>
            </div>
          </div>

          <button onClick={startGame} style={styles.startButton}>
            {t('seuil.menu.start')}
          </button>
        </div>
      </div>
    );
  }

  // Result screen
  if (phase === 'result') {
    const percentage = Math.round((score / questions.length) * 100);
    const getMessage = () => {
      if (percentage >= 90) return t('seuil.result.msg.perfect');
      if (percentage >= 70) return t('seuil.result.msg.great');
      if (percentage >= 50) return t('seuil.result.msg.good');
      return t('seuil.result.msg.low');
    };

    return (
      <div style={styles.resultContainer}>
        <div style={styles.resultContent}>
          <p style={styles.resultSymbol}>◇</p>
          <h1 style={styles.resultTitle}>{score}/{questions.length}</h1>
          <p style={styles.resultMessage}>{getMessage()}</p>

          <div style={styles.resultBar}>
            <div
              style={{
                ...styles.resultBarFill,
                width: `${percentage}%`
              }}
            />
          </div>

          <p style={styles.resultLevel}>
            {levelData.name} · {mode === 'classique' ? 'Classique' : 'Sprint'}
          </p>

          <div style={styles.resultActions}>
            <button onClick={startGame} style={styles.replayButton}>
              {t('seuil.result.replay')}
            </button>
            <button onClick={resetQuiz} style={styles.menuButton}>
              {t('seuil.result.menu')}
            </button>
          </div>

          <p style={styles.resultEcho}>
            {t('seuil.result.quote')}
          </p>
        </div>
      </div>
    );
  }

  // Playing / Reveal screen
  if (!currentQuestion) return null;

  const timerDanger = timeLeft <= 5;
  const timerCritical = timeLeft <= 3;

  return (
    <div style={{
      ...styles.gameContainer,
      background: phase === 'reveal'
        ? (isCorrect ? '#003D2C' : '#2A1A1A')
        : '#FAF8F2'
    }}>
      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${((currentIndex + 1) / questions.length) * 100}%`
          }}
        />
      </div>

      {/* Header */}
      <div style={styles.header}>
        <span style={{
          ...styles.questionCount,
          color: phase === 'reveal' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
        }}>
          {currentIndex + 1}/{questions.length}
        </span>
        <span style={{
          ...styles.category,
          color: phase === 'reveal' ? 'rgba(255,255,255,0.5)' : '#003D2C'
        }}>
          {currentQuestion.category}
        </span>
      </div>

      {/* Timer - only in playing phase */}
      {phase === 'playing' && (
        <div style={styles.timerSection}>
          <div style={{
            ...styles.timer,
            color: timerCritical ? '#8B0000' : (timerDanger ? '#C9A227' : '#003D2C'),
            animation: timerCritical ? 'pulse 0.5s ease-in-out infinite' : 'none'
          }}>
            {timeLeft}
          </div>
        </div>
      )}

      {/* Question */}
      <div style={styles.questionSection}>
        <h2 style={{
          ...styles.question,
          color: phase === 'reveal' ? '#FAF8F2' : '#1A1A1A'
        }}>
          {currentQuestion.question}
        </h2>
      </div>

      {/* Choices */}
      <div style={styles.choices}>
        {currentQuestion.choices.map((choice, i) => {
          const letter = choice.charAt(0);
          const isSelected = selectedAnswer === letter;
          const isCorrectAnswer = currentQuestion.answer === letter;
          const showResult = phase === 'reveal';

          let buttonStyle = { ...styles.choiceButton };

          if (showResult) {
            if (isCorrectAnswer) {
              buttonStyle = {
                ...buttonStyle,
                background: 'rgba(0, 200, 100, 0.3)',
                borderColor: '#00C864',
                color: '#FAF8F2'
              };
            } else if (isSelected && !isCorrectAnswer) {
              buttonStyle = {
                ...buttonStyle,
                background: 'rgba(200, 0, 0, 0.3)',
                borderColor: '#C80000',
                color: '#FAF8F2'
              };
            } else {
              buttonStyle = {
                ...buttonStyle,
                opacity: 0.3,
                color: '#FAF8F2',
                borderColor: 'rgba(255,255,255,0.2)'
              };
            }
          }

          return (
            <button
              key={letter}
              onClick={() => phase === 'playing' && handleAnswer(letter)}
              disabled={phase !== 'playing'}
              style={buttonStyle}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {/* Reveal content */}
      {phase === 'reveal' && (
        <div style={styles.revealSection}>
          {/* Explanation */}
          <p style={styles.explanation}>
            {currentQuestion.explanation}
          </p>

          {/* Echo - the poetic seed */}
          <p style={styles.echo}>
            "{currentQuestion.echo}"
          </p>

          {/* Next button */}
          <button onClick={nextQuestion} style={styles.nextButton}>
            {currentIndex + 1 >= questions.length ? 'VOIR LE RÉSULTAT' : 'SUIVANT'}
          </button>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#FAF8F2',
    position: 'relative'
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#003D2C',
    cursor: 'pointer',
    opacity: 0.7,
    zIndex: 10
  },

  // Menu
  menuContent: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    textAlign: 'center'
  },
  menuSymbol: {
    fontSize: '48px',
    color: '#003D2C',
    opacity: 0.3,
    marginBottom: '16px'
  },
  menuTitle: {
    fontSize: '42px',
    fontWeight: 300,
    color: '#1A1A1A',
    letterSpacing: '0.3em',
    marginBottom: '8px'
  },
  menuSubtitle: {
    fontSize: '16px',
    color: '#1A1A1A',
    opacity: 0.6,
    marginBottom: '48px'
  },
  selector: {
    marginBottom: '32px',
    textAlign: 'center'
  },
  selectorLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#003D2C',
    letterSpacing: '0.2em',
    marginBottom: '12px'
  },
  levelButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  levelButton: {
    width: '40px',
    height: '40px',
    border: '1px solid #003D2C',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  levelName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#003D2C',
    marginBottom: '4px'
  },
  levelDesc: {
    fontSize: '12px',
    color: '#1A1A1A',
    opacity: 0.5
  },
  modeButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  modeButton: {
    padding: '16px 24px',
    border: '1px solid #003D2C',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  modeDesc: {
    fontSize: '10px',
    fontWeight: 400,
    opacity: 0.7
  },
  startButton: {
    marginTop: '24px',
    padding: '18px 56px',
    background: '#003D2C',
    color: '#FAF8F2',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.15em',
    cursor: 'pointer'
  },

  // Game
  gameContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'background 0.3s ease'
  },
  progressBar: {
    height: '3px',
    background: 'rgba(0,0,0,0.1)',
    width: '100%'
  },
  progressFill: {
    height: '100%',
    background: '#003D2C',
    transition: 'width 0.3s ease'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 24px',
    fontSize: '12px'
  },
  questionCount: {
    fontWeight: 500
  },
  category: {
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontSize: '10px'
  },
  timerSection: {
    textAlign: 'center',
    padding: '16px'
  },
  timer: {
    fontSize: '64px',
    fontWeight: 200,
    transition: 'color 0.3s ease'
  },
  questionSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    textAlign: 'center'
  },
  question: {
    fontSize: '22px',
    fontWeight: 400,
    lineHeight: 1.5,
    maxWidth: '600px'
  },
  choices: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '500px',
    margin: '0 auto',
    width: '100%'
  },
  choiceButton: {
    padding: '16px 20px',
    background: 'transparent',
    border: '1px solid rgba(0, 61, 44, 0.3)',
    color: '#1A1A1A',
    fontSize: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Reveal
  revealSection: {
    padding: '24px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto'
  },
  explanation: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.7,
    marginBottom: '20px'
  },
  echo: {
    fontSize: '16px',
    fontStyle: 'italic',
    color: '#C9A227',
    lineHeight: 1.6,
    marginBottom: '32px',
    padding: '16px',
    borderLeft: '2px solid #C9A227'
  },
  nextButton: {
    padding: '16px 40px',
    background: 'transparent',
    color: '#FAF8F2',
    border: '1px solid rgba(255,255,255,0.3)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.15em',
    cursor: 'pointer'
  },

  // Result
  resultContainer: {
    minHeight: '100vh',
    background: '#FAF8F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  },
  resultContent: {
    textAlign: 'center',
    maxWidth: '400px'
  },
  resultSymbol: {
    fontSize: '48px',
    color: '#003D2C',
    opacity: 0.3,
    marginBottom: '16px'
  },
  resultTitle: {
    fontSize: '72px',
    fontWeight: 200,
    color: '#003D2C',
    marginBottom: '8px'
  },
  resultMessage: {
    fontSize: '18px',
    color: '#1A1A1A',
    marginBottom: '32px',
    fontStyle: 'italic'
  },
  resultBar: {
    height: '6px',
    background: 'rgba(0,61,44,0.1)',
    borderRadius: '3px',
    marginBottom: '16px',
    overflow: 'hidden'
  },
  resultBarFill: {
    height: '100%',
    background: '#003D2C',
    borderRadius: '3px',
    transition: 'width 0.5s ease'
  },
  resultLevel: {
    fontSize: '11px',
    color: '#003D2C',
    opacity: 0.6,
    letterSpacing: '0.1em',
    marginBottom: '32px'
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '40px'
  },
  replayButton: {
    padding: '16px 32px',
    background: '#003D2C',
    color: '#FAF8F2',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.15em',
    cursor: 'pointer'
  },
  menuButton: {
    padding: '16px 32px',
    background: 'transparent',
    color: '#003D2C',
    border: '1px solid #003D2C',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.15em',
    cursor: 'pointer'
  },
  resultEcho: {
    fontSize: '14px',
    color: '#1A1A1A',
    opacity: 0.4,
    fontStyle: 'italic'
  }
};
