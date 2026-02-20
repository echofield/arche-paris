/**
 * ARCHÉ — Single source of truth for zone (PAR-XX).
 * One resolver instance; Aura and Map consume via this context to avoid duplicate watchPosition.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTerritoryResolver, type TerritoryResolverState } from '@/hooks/useTerritoryResolver';

const defaultState: TerritoryResolverState = {
  zoneId: null,
  lastStableZoneId: null,
  status: 'approximate',
  accuracyM: null,
  samplesCount: 0,
  zoneForApi: 'PAR-10',
  lastLat: null,
  lastLng: null,
  lastAccuracy: null,
  lastTs: null,
  outsideCoverage: false,
};

const TerritoryResolverContext = createContext<TerritoryResolverState>(defaultState);

export function TerritoryResolverProvider({ children }: { children: ReactNode }) {
  const state = useTerritoryResolver();
  const value = useMemo(() => state, [
    state.zoneId,
    state.lastStableZoneId,
    state.status,
    state.accuracyM,
    state.samplesCount,
    state.zoneForApi,
    state.lastLat,
    state.lastLng,
    state.lastAccuracy,
    state.lastTs,
    state.outsideCoverage,
  ]);
  return (
    <TerritoryResolverContext.Provider value={value}>
      {children}
    </TerritoryResolverContext.Provider>
  );
}

export function useTerritoryResolverContext(): TerritoryResolverState {
  return useContext(TerritoryResolverContext);
}
