/**
 * ARCHÉ — Perception State Hook
 *
 * Tracks GPS vs perceived location for the Méchain Glitch mechanic.
 * The core gameplay loop: sometimes GPS and observation disagree.
 */

import { useState, useCallback, useMemo } from 'react';
import { useGeolocation } from './useGeolocation';
import {
  applyMeridianDrift,
  detectMeridianConflict,
  distanceToMeridianMeters,
  type ConflictState,
} from '../utils/meridien-geo';

export type PerceptionConfidence = 'low' | 'medium' | 'high';

export interface PerceptionState {
  /** Raw GPS from device */
  gps: {
    lat: number;
    lng: number;
    accuracy_m: number;
  } | null;

  /** GPS with Méchain drift applied (what the "instrument" shows) */
  driftedGps: {
    lat: number;
    lng: number;
    driftMeters: number;
  } | null;

  /** Player's perceived distance to meridian (from visual observation) */
  perceivedDistanceM: number | null;
  perceivedConfidence: PerceptionConfidence;

  /** Conflict detection result */
  conflict: ConflictState | null;

  /** Whether conflict has been detected and not yet resolved */
  conflictPending: boolean;
}

export interface UsePerceptionStateReturn extends PerceptionState {
  /** Refresh GPS reading */
  refreshGps: () => void;

  /** Set perceived distance (from player's visual observation) */
  setPerceivedDistance: (distanceM: number, confidence: PerceptionConfidence) => void;

  /** Clear perceived distance */
  clearPerception: () => void;

  /** Mark conflict as resolved */
  resolveConflict: () => void;

  /** Check if near the meridian (within interaction range) */
  isNearMeridian: boolean;

  /** Distance to meridian according to drifted GPS */
  instrumentDistanceM: number | null;
}

/**
 * Hook for tracking GPS vs perception state.
 * Enables the "trust the instrument vs trust your eyes" gameplay.
 */
export function usePerceptionState(): UsePerceptionStateReturn {
  const geo = useGeolocation();

  const [perceivedDistanceM, setPerceivedDistanceM] = useState<number | null>(null);
  const [perceivedConfidence, setPerceivedConfidence] = useState<PerceptionConfidence>('low');
  const [conflictPending, setConflictPending] = useState(false);

  // Calculate drifted GPS (the "instrument" reading with Méchain error)
  const driftedGps = useMemo(() => {
    if (geo.lat === null || geo.lng === null) return null;

    // Seed changes slowly (every ~10 seconds) to create subtle drift variation
    const seed = Math.floor(Date.now() / 10000);

    return applyMeridianDrift(geo.lat, geo.lng, { seed });
  }, [geo.lat, geo.lng]);

  // Detect conflict between GPS and perception
  const conflict = useMemo(() => {
    if (!driftedGps || perceivedDistanceM === null) return null;

    const result = detectMeridianConflict(driftedGps.lng, perceivedDistanceM);

    // If conflict detected and not already pending, mark as pending
    if (result.inConflict && !conflictPending) {
      setConflictPending(true);
    }

    return result;
  }, [driftedGps, perceivedDistanceM, conflictPending]);

  // Distance to meridian according to drifted GPS
  const instrumentDistanceM = useMemo(() => {
    if (!driftedGps) return null;
    return distanceToMeridianMeters(driftedGps.lng);
  }, [driftedGps]);

  // Check if within interaction range of meridian
  const isNearMeridian = instrumentDistanceM !== null && instrumentDistanceM < 100;

  // Set perceived distance from visual observation
  const setPerceivedDistance = useCallback((distanceM: number, confidence: PerceptionConfidence) => {
    setPerceivedDistanceM(distanceM);
    setPerceivedConfidence(confidence);
  }, []);

  // Clear perception
  const clearPerception = useCallback(() => {
    setPerceivedDistanceM(null);
    setPerceivedConfidence('low');
  }, []);

  // Resolve conflict (after player makes a trust decision)
  const resolveConflict = useCallback(() => {
    setConflictPending(false);
  }, []);

  return {
    gps: geo.lat !== null && geo.lng !== null && geo.accuracy_m !== null
      ? { lat: geo.lat, lng: geo.lng, accuracy_m: geo.accuracy_m }
      : null,
    driftedGps,
    perceivedDistanceM,
    perceivedConfidence,
    conflict,
    conflictPending,
    refreshGps: geo.refresh,
    setPerceivedDistance,
    clearPerception,
    resolveConflict,
    isNearMeridian,
    instrumentDistanceM,
  };
}
