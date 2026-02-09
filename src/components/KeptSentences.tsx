/**
 * ARCHÉ — Phrases gardées (Life Layer Phase 0)
 * List of sentences the user saved from Miroir or (later) Champ.
 */

import { useState, useEffect } from 'react';
import { BackButton } from './BackButton';
import { useTranslation } from '../utils/i18n';
import { loadMirrorKept, type KeptSentenceItem } from '../utils/card-gate-client';

interface KeptSentencesProps {
  cardId: string;
  onBack: () => void;
}

export function KeptSentences({ cardId, onBack }: KeptSentencesProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<KeptSentenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMirrorKept(cardId)
      .then((list) => {
        if (!cancelled) setItems(list);
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
        minHeight: '100vh',
        background: '#FAF8F2',
        position: 'relative',
        padding: 'clamp(24px, 4vw, 48px)',
        paddingTop: 'clamp(80px, 10vh, 100px)',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      <BackButton onClick={onBack} />
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 400,
          color: '#003D2C',
          marginBottom: '24px',
        }}
      >
        {t('miroir.kept')}
      </h1>
      {loading && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#6B6455' }}>…</p>
      )}
      {error && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#8B0000' }}>{error}</p>
      )}
      {!loading && !error && items.length === 0 && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#6B6455' }}>
          {t('miroir.emptyKept')}
        </p>
      )}
      {!loading && items.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                padding: '16px 0',
                borderBottom: '1px solid rgba(0, 61, 44, 0.08)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 15,
                  color: '#1A1A1A',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {item.text}
              </p>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  color: '#6B6455',
                  marginTop: '4px',
                  display: 'inline-block',
                }}
              >
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
