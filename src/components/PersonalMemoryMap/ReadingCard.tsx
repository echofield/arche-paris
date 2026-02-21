/**
 * Mon Paris reading card — one sentence, optional. Dismiss for the day (localStorage).
 */

import { useState, useEffect } from 'react';
import type { MonParisReading } from '../../lib/api';

const DISMISS_KEY_PREFIX = 'monparis_reading_dismiss_';

function getTodayParisDate(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

function getDismissKey(parisDate: string, reading: MonParisReading): string {
  return `${DISMISS_KEY_PREFIX}${parisDate}_${reading.code ?? reading.layer}`;
}

interface ReadingCardProps {
  reading: MonParisReading;
}

export function ReadingCard({ reading }: ReadingCardProps) {
  const parisDate = getTodayParisDate();
  const dismissKey = getDismissKey(parisDate, reading);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(Boolean(localStorage.getItem(dismissKey)));
    } catch {
      setDismissed(false);
    }
  }, [dismissKey]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissKey, '1');
      setDismissed(true);
    } catch {
      setDismissed(true);
    }
  };

  if (dismissed) return null;

  return (
    <div
      style={{
        marginBottom: 24,
        padding: '12px 14px',
        background: 'rgba(0, 61, 44, 0.04)',
        borderRadius: 6,
        border: '1px solid rgba(0, 61, 44, 0.08)',
        position: 'relative',
      }}
    >
      <p
        style={{
          margin: 0,
          paddingRight: 24,
          fontFamily: 'var(--font-serif)',
          fontSize: 12,
          fontStyle: 'italic',
          color: '#003D2C',
          opacity: 0.75,
          lineHeight: 1.45,
        }}
      >
        {reading.text}
      </p>
      <button
        type="button"
        aria-label="Fermer"
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 22,
          height: 22,
          padding: 0,
          border: 'none',
          background: 'transparent',
          color: '#003D2C',
          opacity: 0.45,
          fontSize: 14,
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
