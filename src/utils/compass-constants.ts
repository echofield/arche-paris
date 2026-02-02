/**
 * ARCHÉ — Compass pressure thresholds (meters).
 * Used only in Trésor Caché when Compass is active. No location stored.
 */

export const PRESSURE_START_M = 60;
export const WARM_M = 35;
export const HOT_M = 18;
export const NEAR_M = 10;

export type PressureZone = 'far' | 'warm' | 'hot' | 'near';

export function getPressureZone(distanceM: number): PressureZone {
  if (distanceM > PRESSURE_START_M) return 'far';
  if (distanceM > WARM_M) return 'warm';
  if (distanceM > HOT_M) return 'hot';
  return 'near';
}

export function isWithinProofRange(distanceM: number): boolean {
  return distanceM <= HOT_M;
}
