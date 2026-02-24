/**
 * getStabilizedFix — one-shot GPS acquisition via verification burst.
 *
 * Wraps getVerificationBurst() from location-trust, returning a clean
 * position object or null. Use for actions that need a single reliable
 * fix (PlaceScan, ritual start/complete) instead of raw getCurrentPosition.
 */

import { getVerificationBurst } from './location-trust';

export interface StabilizedFix {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  heading: number | null;
}

export async function getStabilizedFix(opts?: {
  durationMs?: number;
  intervalMs?: number;
}): Promise<StabilizedFix | null> {
  const burst = await getVerificationBurst(opts);

  if (!burst.best) return null;

  return {
    lat: burst.best.lat,
    lng: burst.best.lng,
    accuracy: burst.best.accuracy,
    timestamp: burst.best.ts,
    heading: burst.best.heading ?? null,
  };
}
