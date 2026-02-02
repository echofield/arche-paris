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
