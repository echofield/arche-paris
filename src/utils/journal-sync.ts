/**
 * ARCHÉ — Journal sync: My Paris ↔ Carnet (notes)
 *
 * All access via Card Gate only. No direct DB. If Card Gate fails: queue locally / show offline.
 */

import { getSymbolById } from '../data/symbols';
import {
  MY_PARIS_PLACE_ID,
  WALK_PLACE_ID,
  ECHO_PLACE_ID_PREFIX,
  MILESTONE_PLACE_ID,
  MERIDIEN_PLACE_ID_PREFIX,
  AURA_SEAL_PLACE_ID,
  loadMyParisNote as gateLoadMyParisNote,
  saveMyParisNote as gateSaveMyParisNote,
  appendJournalEntry,
} from './card-gate-client';

export { MY_PARIS_PLACE_ID, WALK_PLACE_ID, ECHO_PLACE_ID_PREFIX, MILESTONE_PLACE_ID, MERIDIEN_PLACE_ID_PREFIX, AURA_SEAL_PLACE_ID };

/**
 * Load the My Paris note for this card (for display in My Paris page).
 */
export async function loadMyParisNote(cardId: string): Promise<string> {
  try {
    return await gateLoadMyParisNote(cardId);
  } catch (e) {
    console.warn('loadMyParisNote (Card Gate):', e);
    return '';
  }
}

/**
 * Save the My Paris note. Writes via Card Gate so it appears in Carnet (notes).
 */
export async function saveMyParisNote(cardId: string, content: string): Promise<void> {
  try {
    await gateSaveMyParisNote(cardId, content);
  } catch (e) {
    console.warn('saveMyParisNote (Card Gate):', e);
    throw e;
  }
}

/**
 * When a symbol is collected, add a line to the journal so it appears in Notes (Carnet).
 */
export async function syncCollectionToJournal(
  cardId: string,
  symbolId: string,
  symbolName?: string
): Promise<void> {
  const name = symbolName ?? getSymbolById(symbolId)?.name ?? symbolId;
  const content = `Collected: ${name}`;
  try {
    await appendJournalEntry(cardId, symbolId, content);
  } catch (e) {
    console.warn('syncCollectionToJournal (Card Gate):', e);
  }
}

/**
 * Insert one walk line into the journal so it appears in Carnet.
 */
export async function appendWalkToJournal(cardId: string, content: string): Promise<void> {
  try {
    await appendJournalEntry(cardId, WALK_PLACE_ID, content);
  } catch (e) {
    console.warn('appendWalkToJournal (Card Gate):', e);
  }
}

/**
 * Insert one "Witnessed" line for Delayed Resonance (24–48h after proof).
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
    day: 'numeric',
  });
  const content = `${dateStr} — ${artifactTitle}. Witnessed.`;
  try {
    await appendJournalEntry(cardId, `${ECHO_PLACE_ID_PREFIX}${artifactId}`, content);
  } catch (e) {
    console.warn('appendEchoToJournal (Card Gate):', e);
  }
}

/**
 * Insert one silent milestone line (10/50/100/500 km).
 */
export async function appendMilestoneToJournal(
  cardId: string,
  km: number,
  contentLine: string
): Promise<void> {
  try {
    await appendJournalEntry(cardId, `${MILESTONE_PLACE_ID}_${km}`, contentLine);
  } catch (e) {
    console.warn('appendMilestoneToJournal (Card Gate):', e);
  }
}

/**
 * Insert one Méridiens threshold inscription into the journal (Carnet).
 */
export async function appendMeridienInscription(
  cardId: string,
  thresholdId: string,
  content: string
): Promise<void> {
  try {
    await appendJournalEntry(cardId, `${MERIDIEN_PLACE_ID_PREFIX}${thresholdId}`, content);
  } catch (e) {
    console.warn('appendMeridienInscription (Card Gate):', e);
  }
}

/**
 * Insert one Aura "Graver un moment" (seal a moment) inscription into the journal (Carnet).
 */
export async function appendAuraSealToJournal(cardId: string, content: string): Promise<void> {
  try {
    await appendJournalEntry(cardId, AURA_SEAL_PLACE_ID, content);
  } catch (e) {
    console.warn('appendAuraSealToJournal (Card Gate):', e);
  }
}
