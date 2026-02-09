/**
 * ARCHÉ — Miroir (Life Layer Phase 0)
 * Surface: 1 daily sentence + optional "Ce jour-là à Paris" anecdote.
 * Link to "Phrases gardées". No scroll, no history here.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from '../utils/i18n';
import { loadMirrorToday } from '../utils/card-gate-client';

interface MiroirSurfaceProps {
  cardId: string;
  onOpenKept?: () => void;
}

export function MiroirSurface({ cardId, onOpenKept }: MiroirSurfaceProps) {
  const { t } = useTranslation();
  const [sentence, setSentence] = useState<string>('');
  const [anecdote, setAnecdote] = useState<string | null>(null);
  const [kind, setKind] = useState<'foundation' | 'core' | 'echo' | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadMirrorToday(cardId)
      .then((data) => {
        if (!cancelled) {
          setSentence(data.sentence);
          setAnecdote(data.anecdote);
          setKind(data.kind);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [cardId]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '420px',
        padding: '20px 0',
        borderTop: '1px solid rgba(0, 61, 44, 0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.6,
          }}
        >
          {t('miroir.title')}
        </span>
        {kind === 'echo' && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.4,
            }}
          >
            Écho
          </span>
        )}
        {kind === 'foundation' && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.4,
            }}
          >
            Seuil
          </span>
        )}
      </div>
      {loading && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#6B6455' }}>…</p>
      )}
      {error && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#8B0000' }}>{error}</p>
      )}
      {!loading && !error && sentence && (
        <>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(15px, 2vw, 17px)',
              color: '#1A1A1A',
              lineHeight: 1.5,
              marginBottom: anecdote ? '16px' : '12px',
            }}
          >
            {sentence}
          </p>
          {anecdote && (
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 13,
                fontStyle: 'italic',
                color: '#6B6455',
                lineHeight: 1.5,
                marginBottom: '12px',
              }}
            >
              {anecdote}
            </p>
          )}
        </>
      )}
      {onOpenKept && (
        <button
          type="button"
          onClick={onOpenKept}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.06em',
            color: '#003D2C',
            opacity: 0.7,
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          {t('miroir.kept')}
        </button>
      )}
    </div>
  );
}
