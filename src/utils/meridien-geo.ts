/**
 * ARCHÉ — Méridiens: distance to meridian line, state (Égaré/Proche/Sur la ligne/Aligné), nearest threshold.
 */

import { haversineMeters } from './geo';
import type { Threshold } from '../data/meridiens';
import { getThresholds } from '../data/meridiens';

/** Paris meridian longitude (approx.). */
export const MERIDIAN_LNG = 2.3372;

/** At Paris latitude (~48.85°), 1° longitude ≈ 73 km. */
const METERS_PER_DEG_LNG = 73000;

export type MeridienState = 'lost' | 'near' | 'on_line' | 'aligned';

/**
 * Distance from user longitude to the meridian line, in meters.
 */
export function distanceToMeridianMeters(userLng: number): number {
  return Math.abs(userLng - MERIDIAN_LNG) * METERS_PER_DEG_LNG;
}

/**
 * State relative to the meridian line.
 * lost: >100m; near: 30–100m; on_line: 10–30m; aligned: on line + facing N/S (±20°).
 */
export function getMeridienState(
  userLat: number,
  userLng: number,
  userHeading?: number
): MeridienState {
  const distToLine = distanceToMeridianMeters(userLng);

  if (distToLine > 100) return 'lost';
  if (distToLine > 30) return 'near';
  if (distToLine > 10) return 'on_line';

  if (userHeading !== undefined) {
    const facingNS =
      userHeading < 20 ||
      userHeading > 340 ||
      (userHeading > 160 && userHeading < 200);
    if (facingNS) return 'aligned';
  }
  return 'on_line';
}

/**
 * Return the threshold whose radius contains the user, or null.
 */
export function getNearestThreshold(
  userLat: number,
  userLng: number
): Threshold | null {
  const thresholds = getThresholds();
  for (const t of thresholds) {
    const d = haversineMeters(userLat, userLng, t.lat, t.lng);
    if (d <= t.radiusM) return t;
  }
  return null;
}
