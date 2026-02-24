/**
 * useStabilizedPosition — shared GPS hook for all ARCHÉ components.
 *
 * Single source of truth: accuracy gate, warmup streak, teleport rejection.
 * Every component that needs live position should use this instead of
 * raw navigator.geolocation.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GPS_MAX_ACCURACY_M,
  GPS_WARMUP_STREAK,
  GPS_TELEPORT_M,
  GPS_TELEPORT_WINDOW_MS,
} from '../lib/gps-constants';

export interface StabilizedPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  heading: number | null;
  speed: number | null;
}

export type StabilizedStatus = 'idle' | 'warming' | 'locked' | 'weak' | 'error';

export interface StabilizedDebug {
  rawLat: number;
  rawLng: number;
  rawAccuracy: number;
  goodStreak: number;
  status: StabilizedStatus;
  lastRejection: string | null;
}

export interface UseStabilizedPositionOptions {
  maxAccuracyM?: number;
  warmupGoodReadings?: number;
  teleportMaxM?: number;
  teleportWindowMs?: number;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
}

const DEFAULTS = {
  maxAccuracyM: GPS_MAX_ACCURACY_M,
  warmupGoodReadings: GPS_WARMUP_STREAK,
  teleportMaxM: GPS_TELEPORT_M,
  teleportWindowMs: GPS_TELEPORT_WINDOW_MS,
  enableHighAccuracy: true,
  maximumAge: 0,
} as const;

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function useStabilizedPosition(opts: UseStabilizedPositionOptions = {}) {
  const {
    maxAccuracyM = DEFAULTS.maxAccuracyM,
    warmupGoodReadings = DEFAULTS.warmupGoodReadings,
    teleportMaxM = DEFAULTS.teleportMaxM,
    teleportWindowMs = DEFAULTS.teleportWindowMs,
    enableHighAccuracy = DEFAULTS.enableHighAccuracy,
    maximumAge = DEFAULTS.maximumAge,
  } = opts;

  const [pos, setPos] = useState<StabilizedPosition | null>(null);
  const [status, setStatus] = useState<StabilizedStatus>('idle');
  const [debug, setDebug] = useState<StabilizedDebug | null>(null);

  const goodStreakRef = useRef(0);
  const lastAcceptedRef = useRef<StabilizedPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastRejectionRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    goodStreakRef.current = 0;
    lastAcceptedRef.current = null;
    lastRejectionRef.current = null;
    setPos(null);
    setStatus('idle');
    setDebug(null);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('error');
      return;
    }

    setStatus('warming');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        const accuracy = p.coords.accuracy ?? 99999;
        const timestamp = p.timestamp || Date.now();
        const heading = typeof p.coords.heading === 'number' && Number.isFinite(p.coords.heading)
          ? p.coords.heading
          : null;
        const speed = typeof p.coords.speed === 'number' && Number.isFinite(p.coords.speed)
          ? p.coords.speed
          : null;

        if (accuracy > maxAccuracyM) {
          goodStreakRef.current = 0;
          lastRejectionRef.current = `accuracy ${accuracy.toFixed(0)}m > ${maxAccuracyM}m`;
          setStatus((s) => s === 'locked' ? 'locked' : 'weak');
          setDebug({
            rawLat: lat, rawLng: lng, rawAccuracy: accuracy,
            goodStreak: goodStreakRef.current,
            status: 'weak',
            lastRejection: lastRejectionRef.current,
          });
          return;
        }

        const candidate: StabilizedPosition = { lat, lng, accuracy, timestamp, heading, speed };

        const last = lastAcceptedRef.current;
        if (last) {
          const dt = Math.max(1, candidate.timestamp - last.timestamp);
          const dist = haversineMeters(last, candidate);
          if (dist > teleportMaxM && dt < teleportWindowMs) {
            lastRejectionRef.current = `teleport ${dist.toFixed(0)}m in ${dt}ms`;
            setDebug({
              rawLat: lat, rawLng: lng, rawAccuracy: accuracy,
              goodStreak: goodStreakRef.current,
              status: status,
              lastRejection: lastRejectionRef.current,
            });
            return;
          }
        }

        goodStreakRef.current += 1;

        if (!lastAcceptedRef.current && goodStreakRef.current < warmupGoodReadings) {
          lastRejectionRef.current = null;
          setStatus('warming');
          setDebug({
            rawLat: lat, rawLng: lng, rawAccuracy: accuracy,
            goodStreak: goodStreakRef.current,
            status: 'warming',
            lastRejection: null,
          });
          return;
        }

        lastAcceptedRef.current = candidate;
        lastRejectionRef.current = null;
        setPos(candidate);
        setStatus('locked');
        setDebug({
          rawLat: lat, rawLng: lng, rawAccuracy: accuracy,
          goodStreak: goodStreakRef.current,
          status: 'locked',
          lastRejection: null,
        });
      },
      () => {
        setStatus('error');
      },
      {
        enableHighAccuracy,
        maximumAge,
        timeout: 15000,
      }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [maxAccuracyM, warmupGoodReadings, teleportMaxM, teleportWindowMs, enableHighAccuracy, maximumAge]);

  return { pos, status, debug, reset };
}
