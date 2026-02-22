/**
 * ARCHÉ — Meridian presence gating helpers.
 * Pure decision functions for when to allow soft confirmations vs seal/progression.
 */

import type { PresenceGrade } from '../lib/presence';

/** Soft confirmations (e.g. open threshold, mark observation): require MED or HIGH. */
export function isGradeSufficientForSoftConfirmation(grade: PresenceGrade | null): boolean {
  return grade === 'MED' || grade === 'HIGH';
}

/** Seal / progression (e.g. crossing, proof save): require HIGH only. */
export function isGradeSufficientForSeal(grade: PresenceGrade | null): boolean {
  return grade === 'HIGH';
}
