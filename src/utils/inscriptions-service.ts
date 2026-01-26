/**
 * ARCHÉ — Inscriptions Service
 *
 * Les Inscriptions: Le miroir du lieu.
 * Chaque marcheur inscrit sa relation au lieu.
 * Pas un journal. Pas des notes. Des inscriptions.
 *
 * Comme graver son passage dans la pierre,
 * sauf que la pierre est le temps.
 */

import { supabase } from './supabase/client';
import {
  UserLieuCard,
  UserLieuCardState,
  Inscription,
  InscriptionLayer,
  InscriptionResult,
  NextPromptResult,
  InscriptionPrompt,
  INSCRIPTION_PROMPTS,
  getPromptByLayer
} from '../types/inscriptions';

// ============================================
// NANOID ALTERNATIVE (simple)
// ============================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// ============================================
// STATE COMPUTATION
// ============================================

/**
 * Calcule l'état basé sur le nombre d'inscriptions
 */
export function computeState(inscriptions: Inscription[]): UserLieuCardState {
  const count = inscriptions.length;
  if (count === 0) return 'glimpsed';
  if (count >= 3) return 'claimed';
  return 'inscribed';
}

// ============================================
// NEXT PROMPT ENGINE
// ============================================

/**
 * Calcule le prochain prompt disponible
 * Règles:
 * - Si aucune inscription: proposer J1 (perception)
 * - Si dernière = perception et >= 2 jours: proposer J3 (memory)
 * - Si dernière = memory et >= 4 jours: proposer J7 (projection)
 * - Sinon: proposer "question" comme alternative douce OU rien
 */
export function computeNextPrompt(
  inscriptions: Inscription[],
  now: Date = new Date()
): NextPromptResult {
  // Aucune inscription: proposer J1
  if (inscriptions.length === 0) {
    return {
      prompt: getPromptByLayer('perception')!,
      reason: 'no_inscriptions'
    };
  }

  // Trier par date décroissante
  const sorted = [...inscriptions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const last = sorted[0];
  const lastDate = new Date(last.created_at);
  const daysSinceLast = Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Déterminer quel layer a été fait
  const layers = new Set(inscriptions.map(i => i.layer));

  // Progression naturelle J1 → J3 → J7
  if (!layers.has('memory') && layers.has('perception')) {
    // A fait J1, pas encore J3
    if (daysSinceLast >= 2) {
      return {
        prompt: getPromptByLayer('memory')!,
        reason: 'ready'
      };
    } else {
      return {
        prompt: getPromptByLayer('question')!, // Alternative douce
        reason: 'too_soon',
        daysUntilNext: 2 - daysSinceLast
      };
    }
  }

  if (!layers.has('projection') && layers.has('memory')) {
    // A fait J3, pas encore J7
    if (daysSinceLast >= 4) {
      return {
        prompt: getPromptByLayer('projection')!,
        reason: 'ready'
      };
    } else {
      return {
        prompt: getPromptByLayer('question')!, // Alternative douce
        reason: 'too_soon',
        daysUntilNext: 4 - daysSinceLast
      };
    }
  }

  // Tous les layers principaux faits, ou veut ajouter plus
  // Proposer "question" comme option continue
  if (layers.has('perception') && layers.has('memory') && layers.has('projection')) {
    return {
      prompt: getPromptByLayer('question')!,
      reason: 'all_done'
    };
  }

  // Cas par défaut: proposer perception si pas encore fait
  if (!layers.has('perception')) {
    return {
      prompt: getPromptByLayer('perception')!,
      reason: 'ready'
    };
  }

  // Fallback
  return {
    prompt: getPromptByLayer('question')!,
    reason: 'ready'
  };
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Récupère la carte d'un lieu pour l'utilisateur courant
 */
export async function getUserLieuCard(
  lieuId: string
): Promise<UserLieuCard | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_lieu_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('lieu_id', lieuId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user hasn't interacted with this lieu
        return null;
      }
      console.error('Error fetching user lieu card:', error);
      return null;
    }

    return data as UserLieuCard;
  } catch (err) {
    console.error('Inscriptions service error:', err);
    return null;
  }
}

/**
 * Met à jour last_touched (optionnel, pour tracking des visites)
 */
export async function touchLieuCard(lieuId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Only update if record exists
    await supabase
      .from('user_lieu_cards')
      .update({ last_touched: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('lieu_id', lieuId);
  } catch (err) {
    // Silent fail - touching is optional
    console.debug('Touch failed:', err);
  }
}

/**
 * Ajoute une inscription à un lieu
 */
export async function addInscription(
  lieuId: string,
  layer: InscriptionLayer,
  promptId: string,
  text: string,
  fallbackUsed: boolean = false
): Promise<InscriptionResult> {
  // Validation
  const trimmed = text.trim();
  if (trimmed.length < 3) {
    return {
      success: false,
      message: 'Trop court. Au moins 3 caractères.',
      error: 'TOO_SHORT'
    };
  }
  if (trimmed.length > 500) {
    return {
      success: false,
      message: 'Trop long. Maximum 500 caractères.',
      error: 'TOO_LONG'
    };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'Connexion requise.',
        error: 'NOT_AUTHENTICATED'
      };
    }

    // Fetch existing card
    const existingCard = await getUserLieuCard(lieuId);

    // Create new inscription
    const newInscription: Inscription = {
      id: generateId(),
      layer,
      prompt_id: promptId,
      text: trimmed,
      created_at: new Date().toISOString(),
      meta: {
        fallback_used: fallbackUsed,
        source: 'user'
      }
    };

    if (existingCard) {
      // Update existing card
      const updatedInscriptions = [...existingCard.inscriptions, newInscription];
      const newState = computeState(updatedInscriptions);

      const { data, error } = await supabase
        .from('user_lieu_cards')
        .update({
          inscriptions: updatedInscriptions,
          state: newState,
          last_touched: new Date().toISOString()
        })
        .eq('id', existingCard.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating inscription:', error);
        return {
          success: false,
          message: 'Impossible de sauvegarder. Réessayez.',
          error: 'DB_ERROR'
        };
      }

      return {
        success: true,
        message: 'Inscription gravée.',
        card: data as UserLieuCard
      };
    } else {
      // Create new card with first inscription
      const newCard = {
        user_id: user.id,
        lieu_id: lieuId,
        state: 'inscribed' as UserLieuCardState,
        inscriptions: [newInscription],
        last_touched: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_lieu_cards')
        .insert(newCard)
        .select()
        .single();

      if (error) {
        console.error('Error creating inscription:', error);
        return {
          success: false,
          message: 'Impossible de créer l\'inscription. Réessayez.',
          error: 'DB_ERROR'
        };
      }

      return {
        success: true,
        message: 'Première inscription gravée.',
        card: data as UserLieuCard
      };
    }
  } catch (err) {
    console.error('Inscriptions service error:', err);
    return {
      success: false,
      message: 'Connexion perdue. Réessayez.',
      error: 'NETWORK_ERROR'
    };
  }
}

/**
 * Récupère toutes les cartes de l'utilisateur courant
 */
export async function getAllUserLieuCards(): Promise<UserLieuCard[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_lieu_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('last_touched', { ascending: false });

    if (error) {
      console.error('Error fetching all lieu cards:', error);
      return [];
    }

    return (data || []) as UserLieuCard[];
  } catch (err) {
    console.error('Inscriptions service error:', err);
    return [];
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Formate une date d'inscription pour affichage
 */
export function formatInscriptionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Traduit un layer en français
 */
export function getLayerLabel(layer: InscriptionLayer): string {
  const labels: Record<InscriptionLayer, string> = {
    perception: 'Perception',
    memory: 'Souvenir',
    projection: 'Projection',
    question: 'Question',
    echo: 'Écho'
  };
  return labels[layer] || layer;
}

/**
 * Retourne l'icône/symbole pour un layer
 */
export function getLayerSymbol(layer: InscriptionLayer): string {
  const symbols: Record<InscriptionLayer, string> = {
    perception: '◯',  // Open eye
    memory: '◐',      // Half moon
    projection: '◉',  // Full
    question: '?',    // Question
    echo: '↺'         // Return
  };
  return symbols[layer] || '·';
}
