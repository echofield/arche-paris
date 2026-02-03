/**
 * ARCHÉ — Companion "Ember" presence (word + glyph)
 * Shown on Home near the Fade glyph. No interaction; calm copy only.
 * Aura whisper: one short oracle line on engrave events, fades 6–12 s.
 */

import { useState, useEffect, useRef } from 'react';
import { ArcheSymbol } from './ArcheSymbol';
import { loadCompanion } from '../utils/companion-service';
import { getCompanionWord, getWhisperLine } from '../data/oracle';
import { subscribeToEngraveEvents } from '../utils/engrave-events';

const WHISPER_VISIBLE_MS = 8000;
const WHISPER_FADE_MS = 2000;

export function CompanionBlock() {
  const state = loadCompanion();
  const word = getCompanionWord(state.level as 0 | 1 | 2 | 3);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [whisperFading, setWhisperFading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const unsub = subscribeToEngraveEvents(() => {
      timeoutRef.current.forEach((id) => clearTimeout(id));
      timeoutRef.current = [];
      setWhisper(getWhisperLine());
      setWhisperFading(false);
      const fadeStart = setTimeout(() => setWhisperFading(true), WHISPER_VISIBLE_MS);
      const clear = setTimeout(() => {
        setWhisper(null);
        setWhisperFading(false);
      }, WHISPER_VISIBLE_MS + WHISPER_FADE_MS);
      timeoutRef.current = [fadeStart, clear];
    });
    return () => {
      timeoutRef.current.forEach((id) => clearTimeout(id));
      timeoutRef.current = [];
      unsub();
    };
  }, []);

  return (
    <div
      aria-label={whisper ? `Whisper: ${whisper}` : `Companion: ${word}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
        flexShrink: 0
      }}
    >
      {whisper && (
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '12px',
            fontStyle: 'italic',
            color: '#003D2C',
            opacity: whisperFading ? 0 : 0.9,
            transition: `opacity ${WHISPER_FADE_MS}ms ease-out`,
            maxWidth: 200,
            textAlign: 'right'
          }}
        >
          {whisper}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArcheSymbol size={20} />
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '14px',
            fontStyle: 'italic',
            color: '#003D2C',
            opacity: 0.7
          }}
        >
          {word}
        </span>
      </div>
    </div>
  );
}
