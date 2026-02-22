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

/** If accuracy_m is missing or above this (m), do not compute alignment; return stable "signal low" state. */
export const MERIDIEN_ACCURACY_THRESHOLD_M = 50;

/** EMA alpha for smoothing lat/lng (0 = no smoothing, 1 = no memory). */
export const MERIDIEN_EMA_ALPHA = 0.25;

/** Max variance (degrees) in recent headings to consider heading "stable" for aligned state. */
export const MERIDIEN_HEADING_STABLE_MAX_VARIANCE_DEG = 25;

export type MeridienState = 'lost' | 'near' | 'on_line' | 'aligned';

/**
 * True only when accuracy is present and good enough to trust alignment computation.
 */
export function isAccuracySufficient(accuracy_m: number | null | undefined): boolean {
  return (
    accuracy_m != null &&
    Number.isFinite(accuracy_m) &&
    accuracy_m <= MERIDIEN_ACCURACY_THRESHOLD_M
  );
}

/**
 * One-step EMA for a point. prev=null → return next.
 */
export function emaPoint(
  prev: { lat: number; lng: number } | null,
  next: { lat: number; lng: number },
  alpha: number
): { lat: number; lng: number } {
  if (!prev) return { lat: next.lat, lng: next.lng };
  const a = Math.max(0, Math.min(1, alpha));
  return {
    lat: prev.lat * (1 - a) + next.lat * a,
    lng: prev.lng * (1 - a) + next.lng * a,
  };
}

/**
 * True if recent headings have variance within maxVarianceDeg (for use with aligned state).
 */
export function isHeadingStable(
  headings: number[],
  maxVarianceDeg: number
): boolean {
  if (headings.length < 2) return false;
  const normalized = headings.map((h) => {
    let n = h % 360;
    if (n < 0) n += 360;
    return n;
  });
  const mean = normalized.reduce((a, b) => a + b, 0) / normalized.length;
  const variance =
    normalized.reduce((sum, h) => {
      let d = Math.abs(h - mean);
      if (d > 180) d = 360 - d;
      return sum + d * d;
    }, 0) / normalized.length;
  const stdDeg = Math.sqrt(variance);
  return stdDeg <= maxVarianceDeg;
}

/** Generous Paris bbox for out-of-coverage guard (no zone dependency). */
const PARIS_BBOX = { minLat: 48.78, maxLat: 48.95, minLng: 2.2, maxLng: 2.45 };

export function inParisBbox(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= PARIS_BBOX.minLat &&
    lat <= PARIS_BBOX.maxLat &&
    lng >= PARIS_BBOX.minLng &&
    lng <= PARIS_BBOX.maxLng
  );
}

/**
 * Distance from user longitude to the meridian line, in meters.
 */
export function distanceToMeridianMeters(userLng: number): number {
  return Math.abs(userLng - MERIDIAN_LNG) * METERS_PER_DEG_LNG;
}

/**
 * State relative to the meridian line.
 * lost: >100m; near: 30–100m; on_line: 10–30m; aligned: on line + facing N/S (±20°), only if heading stable when provided.
 * Returns 'lost' for non-finite coords (no dead ends).
 */
export function getMeridienState(
  userLat: number,
  userLng: number,
  userHeading?: number,
  options?: { useHeadingForAligned?: boolean }
): MeridienState {
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return 'lost';

  const distToLine = distanceToMeridianMeters(userLng);

  if (distToLine > 100) return 'lost';
  if (distToLine > 30) return 'near';
  if (distToLine > 10) return 'on_line';

  const useHeading = options?.useHeadingForAligned !== false;
  if (useHeading && userHeading !== undefined && Number.isFinite(userHeading)) {
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
 * Returns null for non-finite coords (no dead ends).
 */
export function getNearestThreshold(
  userLat: number,
  userLng: number
): Threshold | null {
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return null;
  const thresholds = getThresholds();
  for (const t of thresholds) {
    const d = haversineMeters(userLat, userLng, t.lat, t.lng);
    if (d <= t.radiusM) return t;
  }
  return null;
}

// ============ Méchain Glitch: GPS Drift System ============
// Historical context: Méchain's measurements contained small errors
// that he concealed. The meridian itself carries uncertainty.
// This manifests as intentional GPS drift near the line.

/** At Paris latitude, 1 meter ≈ this many degrees longitude */
const DEG_LNG_PER_METER = 1 / METERS_PER_DEG_LNG;
/** At Paris latitude, 1 meter ≈ this many degrees latitude (approx 111km/deg) */
const DEG_LAT_PER_METER = 1 / 111000;

/**
 * Drift configuration for the Méchain glitch zone.
 * Drift increases as you approach the meridian line.
 */
export interface DriftConfig {
  /** Max drift in meters when exactly on the line */
  maxDriftM: number;
  /** Distance from meridian (meters) where drift starts */
  onsetDistanceM: number;
  /** Seed for deterministic drift (e.g., Date.now() / 10000 for slow drift) */
  seed: number;
}

const DEFAULT_DRIFT_CONFIG: DriftConfig = {
  maxDriftM: 8,
  onsetDistanceM: 50,
  seed: 0,
};

/**
 * Calculate GPS drift based on proximity to the meridian.
 * Returns offset to add to true GPS coordinates.
 * Drift is deterministic (same seed = same offset) but varies spatially.
 */
export function calculateMeridianDrift(
  trueLat: number,
  trueLng: number,
  config: Partial<DriftConfig> = {}
): { driftLat: number; driftLng: number; driftMeters: number } {
  const { maxDriftM, onsetDistanceM, seed } = { ...DEFAULT_DRIFT_CONFIG, ...config };

  const distToMeridian = distanceToMeridianMeters(trueLng);

  // No drift outside onset zone
  if (distToMeridian > onsetDistanceM) {
    return { driftLat: 0, driftLng: 0, driftMeters: 0 };
  }

  // Drift intensity: 0 at onset distance, max at meridian
  const intensity = 1 - (distToMeridian / onsetDistanceM);

  // Deterministic pseudo-random angle based on position + seed
  // This creates spatial variation - drift "feels" different at different spots
  const positionHash = Math.sin(trueLat * 1000 + trueLng * 2000 + seed * 0.1);
  const angle = positionHash * Math.PI * 2;

  // Drift magnitude
  const driftMeters = intensity * maxDriftM * (0.5 + 0.5 * Math.abs(Math.sin(seed * 0.01)));

  // Convert to coordinate offsets
  const driftLat = Math.sin(angle) * driftMeters * DEG_LAT_PER_METER;
  const driftLng = Math.cos(angle) * driftMeters * DEG_LNG_PER_METER;

  return { driftLat, driftLng, driftMeters };
}

/**
 * Apply Méchain drift to GPS coordinates.
 * Returns "apparent" position that the instrument shows.
 */
export function applyMeridianDrift(
  trueLat: number,
  trueLng: number,
  config: Partial<DriftConfig> = {}
): { lat: number; lng: number; driftMeters: number } {
  const { driftLat, driftLng, driftMeters } = calculateMeridianDrift(trueLat, trueLng, config);
  return {
    lat: trueLat + driftLat,
    lng: trueLng + driftLng,
    driftMeters,
  };
}

/**
 * Detect if GPS and perceived location are in conflict.
 * Conflict occurs when one says "on the line" and other says "away".
 */
export interface ConflictState {
  inConflict: boolean;
  gpsState: MeridienState;
  perceivedState: MeridienState;
  gpsDistanceM: number;
  perceivedDistanceM: number;
}

export function detectMeridianConflict(
  gpsLng: number,
  perceivedDistanceM: number
): ConflictState {
  const gpsDistanceM = distanceToMeridianMeters(gpsLng);

  // Determine states
  const gpsState = gpsDistanceM > 100 ? 'lost' :
                   gpsDistanceM > 30 ? 'near' :
                   gpsDistanceM > 10 ? 'on_line' : 'aligned';

  const perceivedState = perceivedDistanceM > 100 ? 'lost' :
                         perceivedDistanceM > 30 ? 'near' :
                         perceivedDistanceM > 10 ? 'on_line' : 'aligned';

  // Conflict: significant disagreement between GPS and perception
  // GPS says close (<20m), perception says far (>40m), or vice versa
  const inConflict = (gpsDistanceM < 20 && perceivedDistanceM > 40) ||
                     (gpsDistanceM > 40 && perceivedDistanceM < 20);

  return {
    inConflict,
    gpsState,
    perceivedState,
    gpsDistanceM,
    perceivedDistanceM,
  };
}
