/**
 * useZoneEntry — Zone entry with GPS validation
 * Handles GPS acquisition + API call + feedback state
 */

import { useState, useCallback } from 'react';
import { api, generateIdempotencyKey, clientTs } from '../lib/api';
import { useGeolocation } from './useGeolocation';

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
  gpsData: {
    lat: number | null;
    lng: number | null;
    accuracy_m: number | null;
  };
}

export interface UseZoneEntryReturn extends ZoneEntryState {
  enterZone: (zoneId: string, dwellMs?: number) => Promise<boolean>;
  reset: () => void;
  geoError: string | null;
}

export function useZoneEntry(): UseZoneEntryReturn {
  const geo = useGeolocation();

  const [state, setState] = useState<ZoneEntryState>({
    status: 'idle',
    error: null,
    eventId: null,
    lastAttemptZoneId: null,
    gpsData: { lat: null, lng: null, accuracy_m: null },
  });

  const enterZone = useCallback(async (zoneId: string, dwellMs?: number): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      status: 'acquiring_gps',
      error: null,
      lastAttemptZoneId: zoneId,
    }));

    // 1. Get GPS position
    const position = await geo.refresh();

    if (!position) {
      setState((prev) => ({
        ...prev,
        status: 'rejected',
        error: {
          code: 'GPS_FAILED',
          message: geo.error || 'Could not acquire GPS position',
        },
      }));
      return false;
    }

    const gpsData = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy_m: position.coords.accuracy,
    };

    setState((prev) => ({
      ...prev,
      status: 'submitting',
      gpsData,
    }));

    // 2. Call zones-enter API
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
      // Parse structured error if available
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

    // 3. Success
    setState((prev) => ({
      ...prev,
      status: 'accepted',
      eventId: result.data?.event_id || null,
      error: null,
    }));
    return true;
  }, [geo]);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      error: null,
      eventId: null,
      lastAttemptZoneId: null,
      gpsData: { lat: null, lng: null, accuracy_m: null },
    });
    geo.clear();
  }, [geo]);

  return {
    ...state,
    enterZone,
    reset,
    geoError: geo.error,
  };
}

// Helper to format zone_id from arrondissement number
export function arrToZoneId(arr: number): string {
  return `PAR-${arr.toString().padStart(2, '0')}`;
}
