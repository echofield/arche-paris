/**
 * ARCHÉ — Oracle (deterministic microcopy)
 * No LLM. Short lines shown at quest-run thresholds.
 */

export type OracleThreshold = 'start' | 'arrive_stop' | 'proof_added' | 'close';

const ORACLE: Record<string, Record<OracleThreshold, string | Record<string, string>>> = {
  'temporal-meridians': {
    start: 'Walk slowly. The city is precise when you are.',
    arrive_stop: {
      sulpice: 'Notice the asymmetry. The meridian is here.',
      horloge: 'Civil time. Charles V, 1370–1371.',
      'point-zero': 'From here, distances begin.'
    },
    proof_added: 'Witness recorded.',
    close: 'From there everything starts. Welcome to ARCHÉ.'
  }
};

/**
 * Returns a short oracle line for the given quest and threshold.
 * For arrive_stop, pass stopId (e.g. sulpice, horloge, point-zero).
 */
export function getOracleLine(
  questId: string,
  threshold: OracleThreshold,
  stopId?: string
): string {
  const quest = ORACLE[questId];
  if (!quest) return '';

  const value = quest[threshold];
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && stopId && value[stopId]) return value[stopId];
  return '';
}

/** Companion "Ember" single word by level (0–3). No metrics. */
const COMPANION_WORDS: Record<0 | 1 | 2 | 3, string> = {
  0: 'Quiet',
  1: 'Awake',
  2: 'Warm',
  3: 'Bright'
};

export function getCompanionWord(level: 0 | 1 | 2 | 3): string {
  return COMPANION_WORDS[level] ?? 'Quiet';
}

/** Reflective questions (oracle visible). No tracking; prompts only. */
const REFLECTIVE_QUESTIONS: string[] = [
  'What have you seen today?',
  'What stayed with you?',
  'What did you notice?',
  'What will you remember?',
  'What was one detail?'
];

/** One question per day (stable by date). Deterministic, no LLM. */
export function getReflectiveQuestion(): string {
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + now.getMonth() * 100 + now.getDate();
  const index = daySeed % REFLECTIVE_QUESTIONS.length;
  return REFLECTIVE_QUESTIONS[index] ?? REFLECTIVE_QUESTIONS[0];
}

/** Aura page — one short sentence (memory/weight). No numbers, dates, counts. Stable per day. */
const AURA_MEMORY_SENTENCES: string[] = [
  'Something has settled.',
  'Your presence has weight.',
  'Not everything needs to be kept.',
  'What mattered, remained.'
];

export function getAuraMemorySentence(): string {
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + now.getMonth() * 100 + now.getDate();
  const index = daySeed % AURA_MEMORY_SENTENCES.length;
  return AURA_MEMORY_SENTENCES[index] ?? AURA_MEMORY_SENTENCES[0];
}

/** Whisper: one short oracle line on inscription/proof events. Fades 6–12 s. */
const WHISPER_LINES: string[] = [
  'The city has noted.',
  'Something was engraved.',
  'The line holds.',
  'Presence, not proof.',
  'The map remembers.',
  'Quiet mark.',
  // Verified recognition (pending → verified)
  'Recognized.',
  'The city confirms.',
  'Marked as seen.',
  'Acknowledged.',
  'Witnessed.',
  'Seen and held.',
  'The record stands.',
  'Noted and kept.'
];

export function getWhisperLine(): string {
  const index = (Date.now() / 1000) % WHISPER_LINES.length;
  return WHISPER_LINES[Math.floor(index)] ?? WHISPER_LINES[0];
}

// ============ Decision Node Whispers ============
// Deterministic by dominant delta, not by choice label.
// Player never sees the numerical delta - only poetic resonance.

const DECISION_WHISPERS: Record<string, string[]> = {
  // Presence increased (trusted the axis, aligned with system)
  presence_up: [
    'The axis holds.',
    'Something aligns.',
    'Your step was noted.',
    'The line accepts.',
    'Orientation confirmed.',
  ],
  // Shadow increased (resisted, deviated, trusted observation)
  shadow_up: [
    'Something in you resisted.',
    'The line bends.',
    'A different path opens.',
    'The edge sharpens.',
    'You carry what you saw.',
  ],
  // Wisdom increased (held complexity, observed both)
  wisdom_up: [
    'The depth increases.',
    'Understanding settles.',
    'The pattern reveals.',
    'Both truths held.',
    'Complexity accepted.',
  ],
  // No dominant delta (balanced or zero)
  neutral: [
    'The city watches.',
    'Nothing changes, yet.',
    'The moment passes.',
    'Silence holds.',
    'The axis waits.',
  ],
};

/**
 * Returns a deterministic whisper based on which Aura axis increased most.
 * Stable per-day + delta-pattern combination.
 */
export function getDecisionWhisper(delta: {
  d_presence: number;
  d_wisdom: number;
  d_shadow: number;
}): string {
  // Determine dominant axis
  const { d_presence, d_wisdom, d_shadow } = delta;
  let category: keyof typeof DECISION_WHISPERS;

  if (d_presence > d_wisdom && d_presence > d_shadow && d_presence > 0) {
    category = 'presence_up';
  } else if (d_shadow > d_presence && d_shadow > d_wisdom && d_shadow > 0) {
    category = 'shadow_up';
  } else if (d_wisdom > d_presence && d_wisdom > d_shadow && d_wisdom > 0) {
    category = 'wisdom_up';
  } else {
    category = 'neutral';
  }

  const lines = DECISION_WHISPERS[category];

  // Deterministic selection: day seed + delta sum
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + now.getMonth() * 100 + now.getDate();
  const deltaSeed = Math.abs(d_presence) + Math.abs(d_wisdom) * 2 + Math.abs(d_shadow) * 3;
  const index = (daySeed + deltaSeed) % lines.length;

  return lines[index] ?? lines[0];
}

// ============ Aura Interpretation Lines ============
// For AuraPage - poetic description of dominant axis

const AURA_INTERPRETATIONS: Record<string, string[]> = {
  presence: [
    'You are oriented by the axis.',
    'The meridian runs through you.',
    'Your path follows the line.',
  ],
  shadow: [
    'You walk the edge of the line.',
    'The city reveals its contradictions to you.',
    'You see what the instrument cannot.',
  ],
  wisdom: [
    'You hold multiple truths.',
    'The paradox does not trouble you.',
    'Between system and sense, you navigate.',
  ],
  none: [
    'Your complexion is forming.',
    'The axes wait for your passage.',
    'Nothing has yet taken shape.',
  ],
};

/**
 * Returns a poetic interpretation for the dominant Aura axis.
 * Stable per-day.
 */
export function getAuraInterpretation(dominant: 'presence' | 'wisdom' | 'shadow' | null): string {
  const category = dominant ?? 'none';
  const lines = AURA_INTERPRETATIONS[category];

  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + now.getMonth() * 100 + now.getDate();
  const index = daySeed % lines.length;

  return lines[index] ?? lines[0];
}
