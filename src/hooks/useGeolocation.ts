/**
 * useGeolocation — GPS position hook for ARCHÉ
 * Returns current position with accuracy info
 */

import { useState, useCallback } from 'react';

export interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  timestamp: number | null;
  loading: boolean;
  error: string | null;
}

export interface UseGeolocationReturn extends GeolocationState {
  refresh: () => Promise<GeolocationPosition | null>;
  clear: () => void;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
};

export function useGeolocation(options?: PositionOptions): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy_m: null,
    timestamp: null,
    loading: false,
    error: null,
  });

  const refresh = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Geolocation not supported by this browser',
      }));
      return null;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy_m: position.coords.accuracy,
            timestamp: position.timestamp,
            loading: false,
            error: null,
          });
          resolve(position);
        },
        (err) => {
          let errorMsg = 'Localisation indisponible';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Autorisez la localisation puis reessayez.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Signal GPS indisponible. Essayez pres d une fenetre ou a l exterieur.';
              break;
            case err.TIMEOUT:
              errorMsg = 'Le GPS met trop de temps. Restez immobile quelques secondes puis reessayez.';
              break;
          }
          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMsg,
          }));
          resolve(null);
        },
        { ...DEFAULT_OPTIONS, ...options }
      );
    });
  }, [options]);

  const clear = useCallback(() => {
    setState({
      lat: null,
      lng: null,
      accuracy_m: null,
      timestamp: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    refresh,
    clear,
  };
}
