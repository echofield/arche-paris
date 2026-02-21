/**
 * ARCHÉ — Semantic boundary for "meaning"
 * Translates backend numeric-ish fields into non-metric, poetic concepts.
 * UI should import from here instead of reading raw points/totals.
 *
 * Invariant: never return numbers; consequence language only; no imperative.
 */

export type ComplexionDelta = {
  d_presence?: number;
  d_wisdom?: number;
  d_shadow?: number;
};

export type PresenceHintKey =
  | 'presence_up'
  | 'wisdom_up'
  | 'shadow_up'
  | 'mixed'
  | 'none';

const TEXTS: Record<Exclude<PresenceHintKey, 'none'>, string> = {
  presence_up: "Ta présence s'est affirmée.",
  wisdom_up: "Ta clarté s'est approfondie.",
  shadow_up: "Une ombre s'est déplacée.",
  mixed: "Quelque chose a bougé.",
};

/**
 * Interpret last_delta into a short French hint. Never returns numbers.
 */
export function interpretComplexionDelta(
  delta: ComplexionDelta | null | undefined
): { key: PresenceHintKey; text: string | null } {
  if (!delta) return { key: 'none', text: null };

  const dPresence = Number(delta.d_presence ?? 0);
  const dWisdom = Number(delta.d_wisdom ?? 0);
  const dShadow = Number(delta.d_shadow ?? 0);

  if (dPresence === 0 && dWisdom === 0 && dShadow === 0) {
    return { key: 'none', text: null };
  }

  // Dominant axis (mirror AuraPage logic)
  if (dPresence > dWisdom && dPresence > Math.abs(dShadow) && dPresence > 0) {
    return { key: 'presence_up', text: TEXTS.presence_up };
  }
  if (dWisdom > dPresence && dWisdom > Math.abs(dShadow) && dWisdom > 0) {
    return { key: 'wisdom_up', text: TEXTS.wisdom_up };
  }
  if (dShadow > 0 && dShadow > dPresence && dShadow > dWisdom) {
    return { key: 'shadow_up', text: TEXTS.shadow_up };
  }

  return { key: 'mixed', text: TEXTS.mixed };
}
