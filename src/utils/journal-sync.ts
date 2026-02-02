/**
 * ARCHÉ — Journal sync: My Paris ↔ Carnet (notes)
 *
 * - My Paris note: one journal_entry per card with place_id = MY_PARIS_PLACE_ID
 *   → appears in Carnet Parisien
 * - Pins (collected symbols): each collect → insert a journal_entry
 *   → "Collected: [name]" appears in notes
 */

import { supabase } from './supabase/client';
import { getSymbolById } from '../data/symbols';

export const MY_PARIS_PLACE_ID = '__my_paris__';
export const WALK_PLACE_ID = '__walk__';
export const ECHO_PLACE_ID_PREFIX = '__echo__';
export const MILESTONE_PLACE_ID = '__milestone__';
export const MERIDIEN_PLACE_ID_PREFIX = '__meridien__';
export const AURA_SEAL_PLACE_ID = '__aura_seal__';

/**
 * Load the My Paris note for this card (for display in My Paris page).
 * Same content appears in Carnet when we save it here.
 */
export async function loadMyParisNote(cardId: string): Promise<string> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('content, updated_at')
    .eq('card_id', cardId)
    .eq('place_id', MY_PARIS_PLACE_ID)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('loadMyParisNote:', error);
    return '';
  }
  return data?.content ?? '';
}

/**
 * Save the My Paris note. Writes to journal_entries so it appears in Carnet (notes).
 * Upsert: update if exists, else insert.
 */
export async function saveMyParisNote(cardId: string, content: string): Promise<void> {
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('card_id', cardId)
    .eq('place_id', MY_PARIS_PLACE_ID)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('journal_entries')
      .update({ content, updated_at: now })
      .eq('id', existing.id);
  } else {
    await supabase.from('journal_entries').insert({
      content,
      place_id: MY_PARIS_PLACE_ID,
      card_id: cardId,
      created_at: now,
      updated_at: now
    });
  }
}

/**
 * When a symbol is collected, add a line to the journal so it appears in Notes (Carnet).
 * Call this after collectSymbol() when the symbol was actually added.
 */
export async function syncCollectionToJournal(
  cardId: string,
  symbolId: string,
  symbolName?: string
): Promise<void> {
  const name = symbolName ?? getSymbolById(symbolId)?.name ?? symbolId;
  const content = `Collected: ${name}`;
  const now = new Date().toISOString();

  await supabase.from('journal_entries').insert({
    content,
    place_id: symbolId,
    card_id: cardId,
    created_at: now,
    updated_at: now
  });
}

/**
 * Insert one walk line into the journal so it appears in Carnet.
 * Call after quest close or manual "Add a walk". One entry per walk.
 */
export async function appendWalkToJournal(cardId: string, content: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await supabase.from('journal_entries').insert({
      content,
      place_id: WALK_PLACE_ID,
      card_id: cardId,
      created_at: now,
      updated_at: now
    });
  } catch (e) {
    console.warn('appendWalkToJournal:', e);
  }
}

/**
 * Insert one "Witnessed" line for Delayed Resonance (24–48h after proof).
 * Idempotent: call only once per proof (track via arche_proof_echoed_v1).
 */
export async function appendEchoToJournal(
  cardId: string,
  artifactId: string,
  artifactTitle: string,
  proofAt: string
): Promise<void> {
  const dateStr = new Date(proofAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const content = `${dateStr} — ${artifactTitle}. Witnessed.`;
  const now = new Date().toISOString();
  try {
    await supabase.from('journal_entries').insert({
      content,
      place_id: `${ECHO_PLACE_ID_PREFIX}${artifactId}`,
      card_id: cardId,
      created_at: now,
      updated_at: now
    });
  } catch (e) {
    console.warn('appendEchoToJournal:', e);
  }
}

/**
 * Insert one silent milestone line (10/50/100/500 km).
 * Idempotent: call only once per threshold (track via arche_milestones_seen_v1).
 */
export async function appendMilestoneToJournal(
  cardId: string,
  km: number,
  contentLine: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await supabase.from('journal_entries').insert({
      content: contentLine,
      place_id: `${MILESTONE_PLACE_ID}_${km}`,
      card_id: cardId,
      created_at: now,
      updated_at: now
    });
  } catch (e) {
    console.warn('appendMilestoneToJournal:', e);
  }
}

/**
 * Insert one Méridiens threshold inscription into the journal (Carnet).
 * Tagged with __meridien__{thresholdId} so it appears as a Méridiens note.
 */
export async function appendMeridienInscription(
  cardId: string,
  thresholdId: string,
  content: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await supabase.from('journal_entries').insert({
      content,
      place_id: `${MERIDIEN_PLACE_ID_PREFIX}${thresholdId}`,
      card_id: cardId,
      created_at: now,
      updated_at: now
    });
  } catch (e) {
    console.warn('appendMeridienInscription:', e);
  }
}

/**
 * Insert one Aura "Graver un moment" (seal a moment) inscription into the journal (Carnet).
 */
export async function appendAuraSealToJournal(cardId: string, content: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await supabase.from('journal_entries').insert({
      content,
      place_id: AURA_SEAL_PLACE_ID,
      card_id: cardId,
      created_at: now,
      updated_at: now
    });
  } catch (e) {
    console.warn('appendAuraSealToJournal:', e);
  }
}
