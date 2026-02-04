/**
 * ARCHÉ — Engrave events for Aura whisper.
 * When inscription or proof is submitted (Card Gate), fire event so Companion/Aura can show one short line (6–12 s).
 * 'verified' fires when any pending item becomes verified (recognition moment).
 */

export type EngraveEventType = 'inscription' | 'proof_meridien' | 'proof_marche' | 'verified';

export interface EngraveEvent {
  type: EngraveEventType;
  at: number;
}

let lastEvent: EngraveEvent | null = null;
const listeners: Set<(e: EngraveEvent) => void> = new Set();

export function emitEngraveEvent(type: EngraveEventType): void {
  const e: EngraveEvent = { type, at: Date.now() };
  lastEvent = e;
  listeners.forEach((cb) => cb(e));
}

export function getLastEngraveEvent(): EngraveEvent | null {
  return lastEvent;
}

export function subscribeToEngraveEvents(callback: (e: EngraveEvent) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
