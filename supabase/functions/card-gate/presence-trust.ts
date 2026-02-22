/**
 * Server-side presence trust (parity with client src/lib/presence/index.ts)
 * Algorithm version "1". Do not trust client grade; recompute here.
 */

export type LocationSample = {
  lat: number;
  lng: number;
  accuracy: number;
  ts: number;
  speed?: number | null;
  heading?: number | null;
};

export type PresenceGrade = "LOW" | "MED" | "HIGH";

export const ALGORITHM_VERSION = "1";

const MAX_AGE_MS = 10_000;
const STABILITY_RADIUS_M = 12;
const STABILITY_LAST_N = 5;
const ACCURACY_CAP_FOR_TRUST_M = 80;
const MIN_ACCURACY_WEIGHT = 5;
const FRESHNESS_THRESHOLD_MS = 2_000;
const ACCURACY_SCALE_M = 50;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeTrust(samples: LocationSample[]): {
  grade: PresenceGrade;
  score: number;
  best: LocationSample | null;
  stable: boolean;
} {
  const now = Date.now();
  const valid = samples.filter((s) => now - s.ts <= MAX_AGE_MS);

  if (valid.length === 0) {
    return { grade: "LOW", score: 0, best: null, stable: false };
  }

  const forTrust = valid.filter((s) => s.accuracy <= ACCURACY_CAP_FOR_TRUST_M);
  const byAccuracy = [...(forTrust.length ? forTrust : valid)].sort(
    (a, b) => a.accuracy - b.accuracy
  );
  const bestSample = byAccuracy[0];

  const weights = valid.map((s) => 1 / Math.max(s.accuracy, MIN_ACCURACY_WEIGHT));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const centerLat =
    sumW > 0
      ? valid.reduce((acc, s, i) => acc + s.lat * weights[i], 0) / sumW
      : bestSample.lat;
  const centerLng =
    sumW > 0
      ? valid.reduce((acc, s, i) => acc + s.lng * weights[i], 0) / sumW
      : bestSample.lng;

  const lastN = valid.slice(-STABILITY_LAST_N);
  const meanDistToCenter =
    lastN.length > 0
      ? lastN.reduce(
          (acc, s) => acc + haversineMeters(s.lat, s.lng, centerLat, centerLng),
          0
        ) / lastN.length
      : 0;
  const stable = meanDistToCenter < STABILITY_RADIUS_M;

  const lastTs = Math.max(...valid.map((s) => s.ts));
  const freshnessBonus = now - lastTs <= FRESHNESS_THRESHOLD_MS ? 0.15 : 0;
  const stabilityBonus = stable ? 0.1 : 0;
  const accuracyPart = clamp01(
    (ACCURACY_SCALE_M - bestSample.accuracy) / ACCURACY_SCALE_M
  );
  const score = clamp01(accuracyPart * 0.65 + stabilityBonus + freshnessBonus);

  let grade: PresenceGrade = "LOW";
  if (score >= 0.75 && bestSample.accuracy <= 20) grade = "HIGH";
  else if (score >= 0.45 && bestSample.accuracy <= 60) grade = "MED";

  return { grade, score, best: bestSample, stable };
}
