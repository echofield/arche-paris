/**
 * ARCHÉ — Companion "Ember" presence (word + glyph)
 * Shown on Home near the Fade glyph. No interaction; calm copy only.
 */

import { ArcheSymbol } from './ArcheSymbol';
import { loadCompanion } from '../utils/companion-service';
import { getCompanionWord } from '../data/oracle';

export function CompanionBlock() {
  const state = loadCompanion();
  const word = getCompanionWord(state.level as 0 | 1 | 2 | 3);

  return (
    <div
      aria-label={`Companion: ${word}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0
      }}
    >
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
  );
}
