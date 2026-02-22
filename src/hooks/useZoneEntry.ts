/**
 * useZoneEntry — Zone entry with GPS validation (verification burst + trust)
 * Handles GPS acquisition + API call + feedback state
 */

import { useState, useCallback } from 'react';
import { api, generateIdempotencyKey, clientTs } from '../lib/api';
import { getVerificationBurst, type LocationTrustGrade } from '../lib/location-trust';

export type ZoneEntryStatus =
  | 'idle'
  | 'acquiring_gps'
  | 'submitting'
  | 'accepted'
  | 'rejected';

export interface ZoneEntryError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ZoneEntryState {
  status: ZoneEntryStatus;
  error: ZoneEntryError | null;
  eventId: string | null;
  lastAttemptZoneId: string | null;
  trustGrade: LocationTrustGrade | null;
  gpsData: {
    lat: number | null;
    lng: number | null;
    accuracy_m: number | null;
  };
}

const LOCATION_WEAK_MSG = "Signal trop faible — approche-toi de l'air libre.";
const LOCATION_UNCERTAIN_MSG = 'Signal incertain — la ville hésite.';

export interface UseZoneEntryReturn extends ZoneEntryState {
  enterZone: (zoneId: string, dwellMs?: number) => Promise<boolean>;
  reset: () => void;
  geoError: string | null;
}

export function useZoneEntry(): UseZoneEntryReturn {
  const [state, setState] = useState<ZoneEntryState>({
    status: 'idle',
    error: null,
    eventId: null,
    lastAttemptZoneId: null,
    trustGrade: null,
    gpsData: { lat: null, lng: null, accuracy_m: null },
  });
  const [geoError, setGeoError] = useState<string | null>(null);

  const enterZone = useCallback(async (zoneId: string, dwellMs?: number): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      status: 'acquiring_gps',
      error: null,
      lastAttemptZoneId: zoneId,
      trustGrade: null,
    }));
    setGeoError(null);

    const trust = await getVerificationBurst({ durationMs: 8000, intervalMs: 750 });

    if (trust.grade === 'LOW' || !trust.best) {
      setState((prev) => ({
        ...prev,
        status: 'rejected',
        error: { code: 'GPS_TRUST_LOW', message: LOCATION_WEAK_MSG },
      }));
      setGeoError(LOCATION_WEAK_MSG);
      return false;
    }

    const gpsData = {
      lat: trust.best.lat,
      lng: trust.best.lng,
      accuracy_m: trust.best.accuracy,
    };

    setState((prev) => ({
      ...prev,
      status: 'submitting',
      trustGrade: trust.grade,
      gpsData,
    }));

    const result = await api.zonesEnter({
      zone_id: zoneId,
      lat: gpsData.lat,
      lng: gpsData.lng,
      accuracy_m: gpsData.accuracy_m,
      dwell_ms: dwellMs,
      client_ts: clientTs(),
      idempotency_key: generateIdempotencyKey(`zone-enter-${zoneId}`),
    });

    if (result.error) {
      let errorObj: ZoneEntryError = { code: 'API_ERROR', message: result.error };
      try {
        const parsed = JSON.parse(result.error);
        if (parsed.code) {
          errorObj = {
            code: parsed.code,
            message: parsed.message || result.error,
            details: parsed.details,
          };
        }
      } catch {
        // Not JSON, use as-is
      }
      setState((prev) => ({
        ...prev,
        status: 'rejected',
        error: errorObj,
      }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      status: 'accepted',
      eventId: result.data?.event_id || null,
      error: null,
      trustGrade: trust.grade,
    }));
    return true;
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      error: null,
      eventId: null,
      lastAttemptZoneId: null,
      trustGrade: null,
      gpsData: { lat: null, lng: null, accuracy_m: null },
    });
    setGeoError(null);
  }, []);

  return {
    ...state,
    enterZone,
    reset,
    geoError,
  };
}

// Helper to format zone_id from arrondissement number
export function arrToZoneId(arr: number): string {
  return `PAR-${arr.toString().padStart(2, '0')}`;
}
