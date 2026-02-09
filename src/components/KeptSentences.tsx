/**
 * ARCHÉ — Kept Sentences Screen
 * Displays sentences saved by the user
 * Matches Aura's artistic direction: calm, minimal, phenomenological
 */

import { useState, useEffect } from 'react';
import { BackButton } from './BackButton';
import { loadMirrorKept, type KeptSentenceItem } from '../utils/card-gate-client';

interface KeptSentencesProps {
  onBack: () => void;
  cardId?: string | null;
}

export function KeptSentences({ onBack, cardId }: KeptSentencesProps) {
  const [items, setItems] = useState<KeptSentenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) {
      setLoading(false);
      return;
    }

    loadMirrorKept(cardId)
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erreur');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cardId]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#FAF8F2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 'clamp(24px, 5vw, 48px)',
        paddingTop: 'clamp(80px, 10vw, 120px)',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <BackButton onClick={onBack} />

      {/* Header */}
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(28px, 6vw, 36px)',
          fontWeight: 400,
          color: '#1A1A1A',
          letterSpacing: '0.08em',
          marginBottom: 4,
        }}
      >
        Phrases gardées
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: '#003D2C',
          opacity: 0.5,
          letterSpacing: '0.1em',
          marginBottom: 'clamp(32px, 8vw, 56px)',
        }}
      >
        Mémoire
      </p>

      {/* Content */}
      {loading ? (
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 14,
            fontStyle: 'italic',
            color: '#1A1A1A',
            opacity: 0.4,
          }}
        >
          ...
        </p>
      ) : error ? (
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 14,
            fontStyle: 'italic',
            color: '#1A1A1A',
            opacity: 0.4,
          }}
        >
          Erreur
        </p>
      ) : items.length === 0 ? (
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(14px, 3vw, 16px)',
            fontStyle: 'italic',
            color: '#1A1A1A',
            opacity: 0.4,
            textAlign: 'center',
            maxWidth: 280,
            lineHeight: 1.5,
          }}
        >
          Aucune phrase gardée.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(24px, 6vw, 32px)',
            width: '100%',
            maxWidth: 400,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                paddingBottom: 'clamp(24px, 6vw, 32px)',
                borderBottom: '0.5px solid rgba(0, 61, 44, 0.1)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  fontStyle: 'italic',
                  color: '#1A1A1A',
                  opacity: 0.6,
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                {item.sentence}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  color: '#003D2C',
                  opacity: 0.3,
                }}
              >
                {new Date(item.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
