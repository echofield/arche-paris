/**
 * ARCHÉ — Presence module (single source of truth for "I am here")
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

export type PresenceGrade = 'LOW' | 'MED' | 'HIGH';

export type PresenceState = 'IDLE' | 'WARMING' | 'SEARCHING' | 'UNSTABLE' | 'ANCHORED';

export type PresenceProof = {
  grade: PresenceGrade;
  best: { lat: number; lng: number; accuracy: number; ts: number } | null;
  samplesCount: number;
  score: number;
  algorithmVersion: string;
};

export type PresenceVerifyRequest = {
  zoneId?: string;
  zone?: { lat: number; lng: number; radiusM: number };
  mode: 'burst' | 'passive';
  samples: LocationSample[];
  client?: { ua?: string; platform?: string };
};

/** Whisper keys for i18n; backend returns one per response. */
export type PresenceWhisperKey =
  | 'presence.searching'
  | 'presence.uncertain'
  | 'presence.weak'
  | 'presence.recognized'
  | 'presence.cooldown'
  | 'presence.outside'
  | 'presence.no_card'
  | 'presence.error'
  | 'presence.teleport'
  | 'presence.interference';

export type PresenceVerifyResponse = {
  ok: boolean;
  grade: PresenceGrade;
  inside?: boolean;
  reasonCode?: 'OK' | 'LOW_TRUST' | 'OUTSIDE_ZONE' | 'COOLDOWN' | 'NO_CARD' | 'TELEPORT';
  /** Preferred: use for t(whisperKey). */
  whisperKey?: PresenceWhisperKey | string;
  /** Legacy; do not rely in new code. */
  whisper?: string;
  serverTs: number;
  /** Only when DEBUG_PRESENCE / VITE_DEBUG_TERRITORY; never show to user. */
  debug?: { effectiveRadius?: number; distance?: number };
};

export const ALGORITHM_VERSION = '1';

const MAX_AGE_MS = 10_000;
const STABILITY_RADIUS_M = 12;
const STABILITY_LAST_N = 5;
const ACCURACY_CAP_FOR_TRUST_M = 80;
const MIN_ACCURACY_WEIGHT = 5;
const FRESHNESS_THRESHOLD_MS = 2_000;
const ACCURACY_SCALE_M = 50;

export function clamp01(x: number): number {
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

const ANCHOR_BONUS = 0.08;
const ANCHOR_MAX_DISTANCE_M = 60;

export type AnchorLike = { lat: number; lng: number; ts: number; grade: string };

/**
 * Compute trust from samples. Optional anchor adds small bonus when near last good fix (never LOW->HIGH).
 * Discards samples older than 10s. Stability: mean distance to center < 12m using last 5 samples.
 */
export function computeTrust(
  samples: LocationSample[],
  anchor?: AnchorLike | null
): {
  grade: PresenceGrade;
  score: number;
  best: LocationSample | null;
  reason: string;
  stable: boolean;
} {
  const now = Date.now();
  const valid = samples.filter((s) => now - s.ts <= MAX_AGE_MS);

  if (valid.length === 0) {
    return {
      grade: 'LOW',
      score: 0,
      best: null,
      reason: 'Aucun signal récent.',
      stable: false,
    };
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
  const freshnessBonus =
    now - lastTs <= FRESHNESS_THRESHOLD_MS ? 0.15 : 0;
  const stabilityBonus = stable ? 0.1 : 0;
  const accuracyPart = clamp01(
    (ACCURACY_SCALE_M - bestSample.accuracy) / ACCURACY_SCALE_M
  );
  let score = clamp01(
    accuracyPart * 0.65 + stabilityBonus + freshnessBonus
  );

  let anchorBonus = 0;
  if (
    anchor &&
    stable &&
    now - lastTs <= FRESHNESS_THRESHOLD_MS &&
    haversineMeters(bestSample.lat, bestSample.lng, anchor.lat, anchor.lng) < ANCHOR_MAX_DISTANCE_M
  ) {
    anchorBonus = Math.min(ANCHOR_BONUS, 1 - score);
    score = clamp01(score + anchorBonus);
  }

  let grade: PresenceGrade = 'LOW';
  if (score >= 0.75 && bestSample.accuracy <= 20) {
    grade = 'HIGH';
  } else if (score >= 0.45 && bestSample.accuracy <= 60) {
    grade = 'MED';
  }

  if (anchorBonus > 0 && grade === 'HIGH') {
    const scoreWithoutAnchor = score - anchorBonus;
    if (scoreWithoutAnchor < 0.45 || bestSample.accuracy > 20) {
      grade = 'MED';
    }
  }

  const reason =
    grade === 'HIGH'
      ? 'Signal fiable.'
      : grade === 'MED'
        ? 'Signal incertain.'
        : 'Signal trop faible.';

  return {
    grade,
    score,
    best: bestSample,
    reason,
    stable,
  };
}

export interface VerificationBurstOptions {
  durationMs?: number;
  intervalMs?: number;
  /** Optional anchor for continuity bonus (never upgrades LOW to HIGH). */
  anchor?: AnchorLike | null;
}

const DEFAULT_DURATION_MS = 8000;
const DEFAULT_INTERVAL_MS = 750;

/**
 * Run a verification burst; returns PresenceProof + samples.
 */
export async function getVerificationBurst(
  opts: VerificationBurstOptions = {}
): Promise<{ proof: PresenceProof; samples: LocationSample[] }> {
  const durationMs = opts.durationMs ?? DEFAULT_DURATION_MS;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;

  const samples: LocationSample[] = [];

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    const result = computeTrust([], opts.anchor);
    return {
      proof: {
        grade: result.grade,
        best: result.best,
        samplesCount: 0,
        score: result.score,
        algorithmVersion: ALGORITHM_VERSION,
      },
      samples: [],
    };
  }

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

  await loop();
  const result = computeTrust(samples, opts.anchor);
  return {
    proof: {
      grade: result.grade,
      best: result.best,
      samplesCount: samples.length,
      score: result.score,
      algorithmVersion: ALGORITHM_VERSION,
    },
    samples,
  };
}

/**
 * Single passive fix; for ambient use only.
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
