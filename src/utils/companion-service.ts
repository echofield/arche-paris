/**
 * ARCHÉ — Companion "Ember" (local only)
 * Bumps on quest close / inscription / presence. Decays after 7 days inactivity. No timers.
 */

import type { CompanionState, CompanionLevel } from '../types/companion';

const STORAGE_KEY = 'arche_companion_v1';
const DECAY_DAYS = 7;

function loadRaw(): CompanionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(state: CompanionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('companion-service: save failed', e);
  }
}

export function loadCompanion(): CompanionState {
  const raw = loadRaw();
  if (raw) return raw;
  const state: CompanionState = {
    level: 0,
    lastTouchedAt: new Date().toISOString()
  };
  save(state);
  return state;
}

export type BumpReason = 'quest_closed' | 'inscription_written' | 'presence';

export function bump(reason: BumpReason): void {
  const state = loadCompanion();
  const now = new Date().toISOString();
  const nextLevel = Math.min(3, (state.level + 1) as CompanionLevel);
  save({
    ...state,
    level: nextLevel as CompanionLevel,
    lastTouchedAt: now
  });
}

export function decayIfNeeded(): void {
  const state = loadCompanion();
  const now = new Date();
  const last = new Date(state.lastTouchedAt);
  const daysSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < DECAY_DAYS) return;
  const nextLevel = Math.max(0, state.level - 1) as CompanionLevel;
  save({
    level: nextLevel,
    lastTouchedAt: state.lastTouchedAt,
    lastDecayCheckAt: now.toISOString()
  });
}
