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
