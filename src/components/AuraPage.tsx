/**
 * ARCHÉ — Aura page
 * Calm, breathing space. Phenomenological mirror. No metrics, scores, or progression.
 * Not a dashboard. Not gamified. Not instructional.
 */

import { useState } from 'react';
import { ArcheSymbol } from './ArcheSymbol';
import { BackButton } from './BackButton';
import { loadCompanion } from '../utils/companion-service';
import { getCompanionWord } from '../data/oracle';
import { getAuraMemorySentence, getReflectiveQuestion } from '../data/oracle';
import { sealingStub } from '../utils/sealing-stub';
import { appendAuraSealToJournal } from '../utils/journal-sync';

interface AuraPageProps {
  onBack: () => void;
  cardId?: string | null;
}

/** Opacity by companion level (0=Quiet → 3=Bright). No animation. */
function glyphOpacity(level: 0 | 1 | 2 | 3): number {
  return 0.4 + level * 0.2; // 0.4, 0.6, 0.8, 1.0
}

export function AuraPage({ onBack, cardId }: AuraPageProps) {
  const [sealOpen, setSealOpen] = useState(false);
  const [sealContent, setSealContent] = useState('');
  const [sealSaved, setSealSaved] = useState(false);
  const state = loadCompanion();
  const level = (state.level ?? 0) as 0 | 1 | 2 | 3;
  const word = getCompanionWord(level);
  const memorySentence = getAuraMemorySentence();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#FAF8F2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 48px)',
        boxSizing: 'border-box'
      }}
    >
      <BackButton onClick={onBack} />

      {/* Header — minimal */}
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(28px, 6vw, 36px)',
          fontWeight: 400,
          color: '#1A1A1A',
          letterSpacing: '0.08em',
          marginBottom: 4
        }}
      >
        AURA
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: '#003D2C',
          opacity: 0.5,
          letterSpacing: '0.1em',
          marginBottom: 'clamp(32px, 8vw, 56px)'
        }}
      >
        Présence
      </p>

      {/* Central visual — ArcheSymbol, opacity by companion level */}
      <div
        style={{
          opacity: glyphOpacity(level),
          marginBottom: 'clamp(20px, 4vw, 32px)'
        }}
      >
        <ArcheSymbol size={140} />
      </div>

      {/* Companion state — one word */}
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(18px, 4vw, 22px)',
          fontStyle: 'italic',
          color: '#003D2C',
          opacity: 0.7,
          marginBottom: 'clamp(16px, 4vw, 24px)'
        }}
      >
        {word}
      </p>

      {/* Memory / weight — one short sentence */}
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(14px, 3vw, 16px)',
          fontStyle: 'italic',
          color: '#1A1A1A',
          opacity: 0.6,
          textAlign: 'center',
          maxWidth: 280,
          marginBottom: 'clamp(40px, 10vw, 72px)',
          lineHeight: 1.5
        }}
      >
        {memorySentence}
      </p>

      {/* Optional: Graver un moment */}
      <button
        type="button"
        onClick={() => setSealOpen(true)}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.08em',
          color: '#003D2C',
          opacity: 0.5,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 16px',
          textDecoration: 'underline',
          textUnderlineOffset: 2
        }}
      >
        Graver un moment
      </button>

      {/* Seal modal — same logic as former Fade panel; optional, discreet */}
      {sealOpen && (
        <div
          role="dialog"
          aria-label="Seal a moment"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: 24
          }}
          onClick={() => {
            setSealOpen(false);
            setSealContent('');
            setSealSaved(false);
          }}
        >
          <div
            style={{
              background: '#FAF8F2',
              border: '1px solid rgba(0, 61, 44, 0.15)',
              borderRadius: 4,
              padding: 32,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 400,
                color: '#1A1A1A',
                marginBottom: 12
              }}
            >
              Seal a moment
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: '#003D2C',
                opacity: 0.7,
                lineHeight: 1.5,
                marginBottom: 12
              }}
            >
              Some moments can be sealed. This is optional.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 13,
                fontStyle: 'italic',
                color: '#003D2C',
                opacity: 0.6,
                marginBottom: 16
              }}
            >
              {getReflectiveQuestion()}
            </p>
            <textarea
              value={sealContent}
              onChange={(e) => setSealContent(e.target.value)}
              placeholder="What did you notice?"
              rows={4}
              disabled={sealSaved}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                marginBottom: 20,
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                color: '#1A1A1A',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(0, 61, 44, 0.2)',
                borderRadius: 0,
                resize: 'vertical',
                minHeight: 80
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setSealOpen(false);
                  setSealContent('');
                  setSealSaved(false);
                }}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  opacity: 0.7,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px'
                }}
              >
                Not now
              </button>
              <button
                type="button"
                disabled={sealSaved || !sealContent.trim()}
                onClick={async () => {
                  if (!cardId || !sealContent.trim()) return;
                  await appendAuraSealToJournal(cardId, sealContent.trim());
                  await sealingStub.seal({
                    kind: 'card_activated',
                    id: `fade-${Date.now()}`,
                    cardId: cardId ?? undefined,
                    completedAt: new Date().toISOString()
                  });
                  setSealSaved(true);
                  setTimeout(() => {
                    setSealOpen(false);
                    setSealContent('');
                    setSealSaved(false);
                  }, 1200);
                }}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: sealSaved ? '#003D2C' : '#003D2C',
                  background: sealSaved ? 'transparent' : 'transparent',
                  border: '0.5px solid rgba(0, 61, 44, 0.3)',
                  cursor: sealSaved || !sealContent.trim() ? 'default' : 'pointer',
                  padding: '8px 16px',
                  opacity: sealSaved || sealContent.trim() ? 1 : 0.5
                }}
              >
                {sealSaved ? 'Saved to Carnet' : 'Seal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
