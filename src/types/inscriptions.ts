/**
 * ARCHÉ — Inscriptions Personnelles
 * Types pour le système d'inscriptions rituelles
 *
 * Un lieu peut devenir "à toi" via accumulation d'inscriptions.
 * Chaque inscription = une réponse datée à une question douce.
 */

// ============================================
// CORE TYPES
// ============================================

/**
 * États de la relation au lieu
 * - glimpsed: vu/consulté, pas encore écrit (UI-only, pas en DB)
 * - inscribed: au moins 1 inscription
 * - claimed: 3+ inscriptions, le lieu est "à toi"
 */
export type UserLieuCardState = 'glimpsed' | 'inscribed' | 'claimed';

/**
 * Types de couches d'inscription
 * Permet un resurfacing intelligent plus tard
 */
export type InscriptionLayer =
  | 'perception' // J1: ce que tu as remarqué
  | 'memory'     // J3: ce que ce lieu contient pour toi
  | 'projection' // J7: ce que tu espères trouver inchangé
  | 'question'   // Alternative: question pour ton futur toi
  | 'echo';      // Future: réponse du futur

/**
 * Une inscription individuelle
 */
export interface Inscription {
  id: string;
  layer: InscriptionLayer;
  prompt_id: string;
  text: string;
  created_at: string; // ISO-8601
  meta: {
    fallback_used: boolean;
    source: 'user';
  };
}

/**
 * Carte personnelle d'un lieu (DB record)
 */
export interface UserLieuCard {
  id: string;
  user_id: string;
  lieu_id: string;
  state: UserLieuCardState;
  inscriptions: Inscription[];
  last_touched: string; // ISO-8601
  created_at: string;   // ISO-8601
}

// ============================================
// PROMPT SYSTEM
// ============================================

/**
 * Un prompt de rituels avec ses whispers (fallbacks doux)
 */
export interface InscriptionPrompt {
  id: string;
  layer: InscriptionLayer;
  question: string;
  whispers: string[];
  minDaysSinceLast: number; // 0 pour J1, 2 pour J3, 4 pour J7
}

/**
 * Résultat du calcul du prochain prompt
 */
export interface NextPromptResult {
  prompt: InscriptionPrompt | null;
  reason: 'ready' | 'too_soon' | 'all_done' | 'no_inscriptions';
  daysUntilNext?: number;
}

// ============================================
// SERVICE TYPES
// ============================================

/**
 * Résultat d'une opération d'inscription
 */
export interface InscriptionResult {
  success: boolean;
  message: string;
  error?: string;
  card?: UserLieuCard;
}

/**
 * Données minimales d'un lieu pour le panel
 */
export interface LieuMinimal {
  id: string;
  name: string;
  arrondissement?: string;
}

// ============================================
// PROMPTS DATA (FR)
// ============================================

export const INSCRIPTION_PROMPTS: InscriptionPrompt[] = [
  // J1 — Perception
  {
    id: 'lieu-v1-perception',
    layer: 'perception',
    question: "Qu'as-tu remarqué ici que d'autres ne voient pas ?",
    whispers: [
      'Un seul détail suffit.',
      'Décris une texture, une phrase, une lumière.'
    ],
    minDaysSinceLast: 0
  },
  // J3 — Memory
  {
    id: 'lieu-v1-memory',
    layer: 'memory',
    question: 'Quel souvenir ce lieu contient maintenant pour toi ?',
    whispers: [
      'Même une image mentale.',
      'Une sensation suffit.'
    ],
    minDaysSinceLast: 2 // >= 2 jours depuis la dernière
  },
  // J7 — Projection
  {
    id: 'lieu-v1-projection',
    layer: 'projection',
    question: 'Si tu revenais dans 10 ans, qu\'espérerais-tu trouver inchangé ?',
    whispers: [
      'Une chose, pas plus.',
      'Un geste, une ambiance, une promesse.'
    ],
    minDaysSinceLast: 4 // >= 4 jours depuis la dernière
  },
  // Alternative — Question
  {
    id: 'lieu-v1-question',
    layer: 'question',
    question: 'Quelle question laisses-tu au futur toi ?',
    whispers: [
      'Une question sans réponse attendue.',
      'Un fil à tirer plus tard.'
    ],
    minDaysSinceLast: 0 // Toujours disponible comme alternative
  }
];

/**
 * Trouve un prompt par son ID
 */
export function getPromptById(promptId: string): InscriptionPrompt | undefined {
  return INSCRIPTION_PROMPTS.find(p => p.id === promptId);
}

/**
 * Trouve le prompt par layer
 */
export function getPromptByLayer(layer: InscriptionLayer): InscriptionPrompt | undefined {
  return INSCRIPTION_PROMPTS.find(p => p.layer === layer);
}
