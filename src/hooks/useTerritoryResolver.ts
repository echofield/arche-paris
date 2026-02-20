/**
 * ARCHÉ — TerritoryResolver: single source of truth for symbolic zone (PAR-01..PAR-20).
 * Calibration burst, weighted fusion, hysteresis. One watchPosition; consumed by Aura and Map via context.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { inferArrondissementFromGeo, isInsideParisTerritory, zoneIdFromArrondissement } from '@/utils/territory';

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15_000,
};

const CALIBRATION_MS = 3500;
const MAX_SAMPLES = 25;
const STALE_MS = 5000;
const MAX_ACCURACY_M = 50;
const STABLE_SEC = 8;
const CONSECUTIVE_GOOD_REQUIRED = 3;
const WEAK_HOLD_MS = 60_000;
const FALLBACK_ZONE = 'PAR-10';

export type TerritoryStatus = 'calibrating' | 'approximate' | 'stable';

export interface TerritoryResolverState {
  zoneId: string | null;
  lastStableZoneId: string | null;
  status: TerritoryStatus;
  accuracyM: number | null;
  samplesCount: number;
  zoneForApi: string;
  lastLat: number | null;
  lastLng: number | null;
  lastAccuracy: number | null;
  lastTs: number | null;
  outsideCoverage: boolean;
}

interface Sample {
  lat: number;
  lng: number;
  accuracy: number;
  ts: number;
}

function weightedFuse(samples: Sample[]): { lat: number; lng: number; accuracy: number } | null {
  if (samples.length === 0) return null;
  let wSum = 0;
  let latSum = 0;
  let lngSum = 0;
  let accSum = 0;
  for (const s of samples) {
    const w = 1 / (s.accuracy * s.accuracy || 1);
    wSum += w;
    latSum += s.lat * w;
    lngSum += s.lng * w;
    accSum += s.accuracy * w;
  }
  if (wSum === 0) return null;
  return {
    lat: latSum / wSum,
    lng: lngSum / wSum,
    accuracy: accSum / wSum,
  };
}

export function useTerritoryResolver(): TerritoryResolverState {
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [lastStableZoneId, setLastStableZoneId] = useState<string | null>(null);
  const [status, setStatus] = useState<TerritoryStatus>('calibrating');
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [samplesCount, setSamplesCount] = useState(0);
  const [lastLat, setLastLat] = useState<number | null>(null);
  const [lastLng, setLastLng] = useState<number | null>(null);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [outsideCoverage, setOutsideCoverage] = useState(false);

  const burstSamplesRef = useRef<Sample[]>([]);
  const burstDoneRef = useRef(false);
  const mountTsRef = useRef(Date.now());
  const candidateZoneRef = useRef<string | null>(null);
  const candidateStableSinceRef = useRef<number | null>(null);
  const consecutiveGoodRef = useRef(0);
  const lastGoodFixAtRef = useRef<number>(0);

  const applyFix = useCallback((lat: number, lng: number, accuracy: number, ts: number) => {
    const now = Date.now();
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const outside = !isInsideParisTerritory(lat, lng);
    setLastLat(lat);
    setLastLng(lng);
    setLastAccuracy(accuracy);
    setLastTs(ts);
    setOutsideCoverage(outside);

    if (outside) return;
    const good = accuracy <= MAX_ACCURACY_M && now - ts < STALE_MS;
    if (good) lastGoodFixAtRef.current = now;

    if (!burstDoneRef.current) {
      if (good && burstSamplesRef.current.length < MAX_SAMPLES) {
        burstSamplesRef.current.push({ lat, lng, accuracy, ts });
        setSamplesCount(burstSamplesRef.current.length);
      }
      const elapsed = now - mountTsRef.current;
      if (elapsed >= CALIBRATION_MS || burstSamplesRef.current.length >= 20) {
        burstDoneRef.current = true;
        const fused = weightedFuse(burstSamplesRef.current);
        if (fused) {
          const arr = inferArrondissementFromGeo(fused.lat, fused.lng);
          const z = arr ? zoneIdFromArrondissement(arr) : null;
          candidateZoneRef.current = z;
          candidateStableSinceRef.current = now;
          consecutiveGoodRef.current = 1;
          setZoneId(z);
          setAccuracyM(fused.accuracy);
          if (z) setLastStableZoneId(z);
          setStatus(z && good ? 'stable' : 'approximate');
        } else {
          setStatus('approximate');
        }
      }
      return;
    }

    const arr = inferArrondissementFromGeo(lat, lng);
    const z = arr ? zoneIdFromArrondissement(arr) : null;
    if (!z) return;

    if (z === candidateZoneRef.current) {
      if (good) {
        consecutiveGoodRef.current = Math.min(consecutiveGoodRef.current + 1, CONSECUTIVE_GOOD_REQUIRED);
        const since = candidateStableSinceRef.current ?? now;
        if (consecutiveGoodRef.current >= CONSECUTIVE_GOOD_REQUIRED && (now - since) / 1000 >= STABLE_SEC) {
          setZoneId(z);
          setLastStableZoneId(z);
          setStatus('stable');
        } else {
          setZoneId(z);
          setStatus(consecutiveGoodRef.current >= CONSECUTIVE_GOOD_REQUIRED ? 'approximate' : 'approximate');
        }
      } else {
        setStatus('approximate');
      }
    } else {
      candidateZoneRef.current = z;
      candidateStableSinceRef.current = now;
      consecutiveGoodRef.current = good ? 1 : 0;
      setZoneId(z);
      setStatus(good ? 'approximate' : 'approximate');
    }

    if (good) setAccuracyM(accuracy);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('approximate');
      return undefined;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        applyFix(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy,
          typeof pos.timestamp === 'number' ? pos.timestamp : Date.now()
        );
      },
      () => {
        setStatus('approximate');
      },
      WATCH_OPTIONS
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [applyFix]);

  const zoneForApi =
    lastStableZoneId ?? (status !== 'stable' ? FALLBACK_ZONE : (zoneId ?? FALLBACK_ZONE));

  return {
    zoneId,
    lastStableZoneId,
    status,
    accuracyM,
    samplesCount,
    zoneForApi,
    lastLat,
    lastLng,
    lastAccuracy,
    lastTs,
    outsideCoverage,
  };
}
