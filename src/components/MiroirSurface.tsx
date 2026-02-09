/**
 * ARCHÉ — Miroir Surface
 * Daily reflection sentence integrated into Aura
 * Matches Aura's artistic direction: calm, minimal, phenomenological
 */

import { useState, useEffect } from 'react';
import { loadMirrorToday, keepMirrorSentence, type MirrorToday } from '../utils/card-gate-client';

interface MiroirSurfaceProps {
  cardId: string | null | undefined;
  onOpenKept?: () => void;
}

export function MiroirSurface({ cardId, onOpenKept }: MiroirSurfaceProps) {
  const [mirror, setMirror] = useState<MirrorToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keeping, setKeeping] = useState(false);

  useEffect(() => {
    if (!cardId) {
      setLoading(false);
      return;
    }

    loadMirrorToday(cardId)
      .then((data) => {
        setMirror(data);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erreur');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cardId]);

  const handleKeep = async () => {
    if (!cardId || !mirror || keeping) return;
    setKeeping(true);
    try {
      await keepMirrorSentence(cardId, mirror.sentence);
      // Optional: show feedback (but keep it minimal, matching Aura style)
    } catch (e) {
      // Silent fail (Aura style: no aggressive error messages)
    } finally {
      setKeeping(false);
    }
  };

  if (loading) {
    return null; // Silent loading (Aura style)
  }

  if (error || !mirror) {
    return null; // Silent fail (Aura style)
  }

  const kindLabel = mirror.kind === 'echo' ? 'Écho' : mirror.kind === 'foundation' ? 'Seuil' : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 320,
        marginBottom: 'clamp(24px, 6vw, 40px)',
      }}
    >
      {/* Daily sentence */}
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(14px, 3vw, 16px)',
          fontStyle: 'italic',
          color: '#1A1A1A',
          opacity: 0.6,
          textAlign: 'center',
          maxWidth: 280,
          marginBottom: mirror.anecdote ? 'clamp(16px, 4vw, 24px)' : 0,
          lineHeight: 1.5,
        }}
      >
        {mirror.sentence}
      </p>

      {/* Kind label (Écho / Seuil) */}
      {kindLabel && (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            letterSpacing: '0.1em',
            color: '#003D2C',
            opacity: 0.4,
            marginTop: -8,
            marginBottom: mirror.anecdote ? 'clamp(16px, 4vw, 24px)' : 'clamp(8px, 2vw, 12px)',
            textTransform: 'uppercase',
          }}
        >
          {kindLabel}
        </p>
      )}

      {/* Historical anecdote */}
      {mirror.anecdote && (
        <div
          style={{
            marginTop: kindLabel ? 0 : 'clamp(16px, 4vw, 24px)',
            marginBottom: 'clamp(16px, 4vw, 24px)',
            paddingTop: 'clamp(16px, 4vw, 24px)',
            borderTop: '0.5px solid rgba(0, 61, 44, 0.15)',
            width: '100%',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.1em',
              color: '#003D2C',
              opacity: 0.5,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Ce jour-là à Paris
          </p>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.5,
              lineHeight: 1.5,
            }}
          >
            {mirror.anecdote}
          </p>
        </div>
      )}

      {/* Actions: Keep + Phrases gardées */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          marginTop: mirror.anecdote ? 0 : 'clamp(8px, 2vw, 12px)',
        }}
      >
        <button
          type="button"
          onClick={handleKeep}
          disabled={keeping}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            letterSpacing: '0.08em',
            color: '#003D2C',
            opacity: keeping ? 0.3 : 0.5,
            background: 'transparent',
            border: 'none',
            cursor: keeping ? 'default' : 'pointer',
            padding: '4px 8px',
            textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          {keeping ? '...' : 'Garder'}
        </button>
        {onOpenKept && (
          <>
            <span
              style={{
                color: '#003D2C',
                opacity: 0.2,
                fontSize: 10,
              }}
            >
              ·
            </span>
            <button
              type="button"
              onClick={onOpenKept}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                letterSpacing: '0.08em',
                color: '#003D2C',
                opacity: 0.5,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              Phrases gardées
            </button>
          </>
        )}
      </div>
    </div>
  );
}
