/**
 * ARCHÉ — Location trust scoring
 * No surveillance; burst-only on user action. No raw coordinates in production logs.
 */

export type LocationSample = {
  lat: number;
  lng: number;
  accuracy: number;
  ts: number;
  speed?: number | null;
  heading?: number | null;
};

export type LocationTrustGrade = 'LOW' | 'MED' | 'HIGH';

export type LocationTrust = {
  score: number;
  grade: LocationTrustGrade;
  best: LocationSample | null;
  samples: LocationSample[];
  reason: string;
};

const MAX_AGE_MS = 10_000;
const CONSISTENCY_RADIUS_M = 15;
const CONSISTENCY_MIN_SAMPLES = 3;
const FRESHNESS_THRESHOLD_MS = 2_000;
const ACCURACY_SCALE_M = 50;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function haversineMeters(
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

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Compute trust from a list of samples. Discards samples older than 10s.
 * Prefers low accuracy and spatial consistency; returns grade and best sample.
 */
export function computeTrust(samples: LocationSample[]): LocationTrust {
  const now = Date.now();
  const valid = samples.filter((s) => now - s.ts <= MAX_AGE_MS);

  if (valid.length === 0) {
    return {
      score: 0,
      grade: 'LOW',
      best: null,
      samples: [],
      reason: 'Aucun signal récent.',
    };
  }

  const byAccuracy = [...valid].sort((a, b) => a.accuracy - b.accuracy);
  const bestSample = byAccuracy[0];
  const medLat = median(valid.map((s) => s.lat));
  const medLng = median(valid.map((s) => s.lng));

  const withinRadius = valid.filter(
    (s) => haversineMeters(s.lat, s.lng, medLat, medLng) <= CONSISTENCY_RADIUS_M
  );
  const consistencyBonus =
    withinRadius.length >= CONSISTENCY_MIN_SAMPLES ? 0.2 : 0;

  const lastTs = Math.max(...valid.map((s) => s.ts));
  const freshnessBonus =
    now - lastTs <= FRESHNESS_THRESHOLD_MS ? 0.15 : 0;

  const accuracyPart = clamp01((ACCURACY_SCALE_M - bestSample.accuracy) / ACCURACY_SCALE_M);
  const score = clamp01(accuracyPart * 0.65 + consistencyBonus + freshnessBonus);

  let grade: LocationTrustGrade = 'LOW';
  if (score >= 0.75 && bestSample.accuracy <= 20) {
    grade = 'HIGH';
  } else if (score >= 0.45 && bestSample.accuracy <= 50) {
    grade = 'MED';
  }

  const reason =
    grade === 'HIGH'
      ? 'Signal fiable.'
      : grade === 'MED'
        ? 'Signal incertain.'
        : 'Signal trop faible.';

  return {
    score,
    grade,
    best: bestSample,
    samples: valid,
    reason,
  };
}

export interface VerificationBurstOptions {
  durationMs?: number;
  intervalMs?: number;
}

const DEFAULT_DURATION_MS = 8000;
const DEFAULT_INTERVAL_MS = 750;

/**
 * Run a verification burst: multiple getCurrentPosition calls over duration.
 * Returns LocationTrust. No watchPosition; no continuous tracking.
 */
export function getVerificationBurst(
  opts: VerificationBurstOptions = {}
): Promise<LocationTrust> {
  const durationMs = opts.durationMs ?? DEFAULT_DURATION_MS;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(
      computeTrust([])
    );
  }

  const samples: LocationSample[] = [];
  const start = Date.now();

  const collectOne = (): Promise<void> =>
    new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          samples.push({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            ts: pos.timestamp,
            speed: pos.coords.speed ?? null,
            heading: pos.coords.heading ?? null,
          });
          resolve();
        },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
      );
    });

  const loop = async (): Promise<void> => {
    await collectOne();
    if (Date.now() - start < durationMs) {
      await new Promise((r) => setTimeout(r, intervalMs));
      return loop();
    }
  };

  return loop().then(() => computeTrust(samples));
}

/**
 * Single passive fix: low accuracy, allow cached. For ambient use only.
 */
export function getPassiveFix(): Promise<LocationSample | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ts: pos.timestamp,
          speed: pos.coords.speed ?? null,
          heading: pos.coords.heading ?? null,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 15000 }
    );
  });
}
