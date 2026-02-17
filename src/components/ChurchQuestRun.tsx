/**
 * ARCHÉ — Church / on-site quest run (code → timer → 3 questions → complete).
 */

import { useState, useEffect, useCallback } from 'react';
import { BackButton } from './BackButton';
import { useTranslation } from '../utils/i18n';
import { getChurchQuestById } from '../data/church-quests';
import {
  startChurchQuest,
  answerChurchQuestion,
  completeChurchQuest,
  type ChurchQuestStartResult,
  type ChurchQuestCompleteResult,
} from '../utils/card-gate-client';

type Phase = 'code' | 'questions' | 'result';

interface ChurchQuestRunProps {
  questId: string;
  cardId: string | null;
  onBack: () => void;
  onComplete?: () => void;
}

const SERIF = 'var(--font-serif)';
const SANS = 'var(--font-sans)';

export function ChurchQuestRun({ questId, cardId, onBack, onComplete }: ChurchQuestRunProps) {
  const quest = getChurchQuestById(questId);
  const [phase, setPhase] = useState<Phase>('code');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [run, setRun] = useState<ChurchQuestStartResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSec, setRemainingSec] = useState(0);
  const [result, setResult] = useState<ChurchQuestCompleteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const expiresAt = run ? new Date(run.expiresAt).getTime() : 0;

  useEffect(() => {
    if (phase !== 'questions' || !run) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemainingSec(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, run, expiresAt]);

  const handleStart = useCallback(async () => {
    if (!cardId || !quest) return;
    setCodeError('');
    setLoading(true);
    try {
      const r = await startChurchQuest(cardId, questId, codeInput.trim());
      setRun(r);
      setPhase('questions');
      setRemainingSec(Math.max(0, Math.floor((new Date(r.expiresAt).getTime() - Date.now()) / 1000)));
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : 'Code incorrect');
    } finally {
      setLoading(false);
    }
  }, [cardId, quest, questId, codeInput]);

  const handleAnswerChange = useCallback(
    async (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      if (!cardId || !run) return;
      try {
        await answerChurchQuestion(cardId, run.runId, questionId, value);
      } catch {
        // non-blocking
      }
    },
    [cardId, run]
  );

  const handleComplete = useCallback(async () => {
    if (!cardId || !run) return;
    setSubmitError('');
    setLoading(true);
    try {
      const r = await completeChurchQuest(cardId, run.runId);
      setResult(r);
      setPhase('result');
      onComplete?.();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [cardId, run, onComplete]);

  if (!quest) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF8F2', padding: 24 }}>
        <BackButton onClick={onBack} />
        <p style={{ fontFamily: SERIF, color: '#1A1A1A' }}>{t('church.unknownQuest')}</p>
      </div>
    );
  }

  if (!cardId) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF8F2', padding: 24 }}>
        <BackButton onClick={onBack} />
        <p style={{ fontFamily: SERIF, color: '#1A1A1A' }}>Connecte-toi pour faire cette quête.</p>
      </div>
    );
  }

  const min = Math.floor(remainingSec / 60);
  const sec = remainingSec % 60;
  const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 48px)',
        boxSizing: 'border-box',
      }}
    >
      <BackButton onClick={onBack} />

      {phase === 'code' && (
        <>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 5vw, 32px)', color: '#1A1A1A', marginBottom: 8 }}>
            {quest.title}
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 14, color: '#003D2C', opacity: 0.7, marginBottom: 24 }}>
            {quest.place_name}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 14, color: '#1A1A1A', marginBottom: 12 }}>
            {t('church.onsitePrompt')}
          </p>
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder={t('church.codePlaceholder')}
            maxLength={20}
            style={{
              fontFamily: SANS,
              fontSize: 18,
              padding: '12px 16px',
              border: '1px solid rgba(0,61,44,0.3)',
              borderRadius: 4,
              background: '#FFF',
              color: '#1A1A1A',
              width: '100%',
              maxWidth: 280,
              marginBottom: 8,
            }}
          />
          {codeError && (
            <p style={{ fontFamily: SANS, fontSize: 13, color: '#c00', marginBottom: 12 }}>{codeError}</p>
          )}
          <button
            type="button"
            onClick={handleStart}
            disabled={loading || !codeInput.trim()}
            style={{
              fontFamily: SANS,
              fontSize: 14,
              padding: '12px 24px',
              background: codeInput.trim() && !loading ? '#003D2C' : 'rgba(0,61,44,0.4)',
              color: '#FAF8F2',
              border: 'none',
              borderRadius: 4,
              cursor: codeInput.trim() && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? '…' : 'Commencer'}
          </button>
        </>
      )}

      {phase === 'questions' && run && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 22, color: '#1A1A1A' }}>{quest.title}</h2>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 18,
                fontWeight: 600,
                color: remainingSec <= 60 ? '#c00' : '#003D2C',
              }}
            >
              {timeStr}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {run.questions.map((q) => (
              <div key={q.id}>
                <label style={{ fontFamily: SANS, fontSize: 14, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
                  {q.prompt}
                </label>
                {q.type === 'mcq' && q.choices ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.choices.map((choice) => (
                      <label key={choice} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={q.id}
                          value={choice}
                          checked={answers[q.id] === choice}
                          onChange={() => handleAnswerChange(q.id, choice)}
                        />
                        <span style={{ fontFamily: SANS, fontSize: 14 }}>{choice}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    style={{
                      fontFamily: SANS,
                      fontSize: 16,
                      padding: '10px 12px',
                      border: '1px solid rgba(0,61,44,0.3)',
                      borderRadius: 4,
                      width: '100%',
                      maxWidth: 400,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {submitError && <p style={{ fontFamily: SANS, fontSize: 13, color: '#c00', marginTop: 12 }}>{submitError}</p>}
          <button
            type="button"
            onClick={handleComplete}
            disabled={loading}
            style={{
              marginTop: 32,
              fontFamily: SANS,
              fontSize: 14,
              padding: '12px 24px',
              background: !loading ? '#003D2C' : 'rgba(0,61,44,0.4)',
              color: '#FAF8F2',
              border: 'none',
              borderRadius: 4,
              cursor: !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? '…' : t('church.finish')}
          </button>
        </>
      )}

      {phase === 'result' && result && (
        <>
          <h2 style={{ fontFamily: SERIF, fontSize: 24, color: '#1A1A1A', marginBottom: 16 }}>Résultat</h2>
          <p style={{ fontFamily: SANS, fontSize: 16, color: '#1A1A1A' }}>
            Score : {result.score} / {quest.questions.length}
          </p>
          {result.earnedSeal ? (
            <p style={{ fontFamily: SERIF, fontSize: 18, color: '#003D2C', marginTop: 8 }}>
              {t('church.sealEarned', { status: t('aura.status.' + result.newStatus) })}
            </p>
          ) : (
            <p style={{ fontFamily: SANS, fontSize: 14, color: '#6B6455', marginTop: 8 }}>
              Temps écoulé — pas de sceau cette fois. Tu peux réessayer.
            </p>
          )}
          <button
            type="button"
            onClick={onBack}
            style={{
              marginTop: 24,
              fontFamily: SANS,
              fontSize: 14,
              padding: '12px 24px',
              background: '#003D2C',
              color: '#FAF8F2',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {t('church.back')}
          </button>
        </>
      )}
    </div>
  );
}
