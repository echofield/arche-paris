/**
 * ARCHÉ — Sealing capability stub (no kernel)
 *
 * Pending and sealed events stored locally only.
 * Later: replace with kernel client; interface stays the same.
 */

import type { SealableEvent, SealingCapability } from '../types/sealable';

const PENDING_KEY = 'arche_pending_seals';
const SEALED_LOG_KEY = 'arche_sealed_log';

function getPending(): SealableEvent[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setPending(events: SealableEvent[]): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(events));
}

function appendSealed(event: SealableEvent): void {
  try {
    const raw = localStorage.getItem(SEALED_LOG_KEY);
    const log: SealableEvent[] = raw ? JSON.parse(raw) : [];
    log.push({ ...event, id: event.id ?? `sealed-${Date.now()}` });
    localStorage.setItem(SEALED_LOG_KEY, JSON.stringify(log));
  } catch {
    // best-effort
  }
}

export const sealingStub: SealingCapability = {
  async listPending(): Promise<SealableEvent[]> {
    return getPending();
  },

  async seal(event: SealableEvent): Promise<void> {
    appendSealed(event);
    const pending = getPending().filter((e) => e.id !== event.id);
    setPending(pending);
  }
};
