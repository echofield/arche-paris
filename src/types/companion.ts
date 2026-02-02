/**
 * ARCHÉ — Companion "Ember" state (Fade-safe, local)
 * Level 0–3, bumps on quest close / inscription, decays after inactivity. No timers.
 */

export type CompanionLevel = 0 | 1 | 2 | 3;

export interface CompanionState {
  level: CompanionLevel;
  lastTouchedAt: string; // ISO
  lastDecayCheckAt?: string; // ISO
}
