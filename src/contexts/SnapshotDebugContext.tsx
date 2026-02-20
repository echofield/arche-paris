/**
 * ARCHÉ — Debug-only: exposes me.locationTrust from world/snapshot for TerritoryDebugStrip.
 * Screens that have worldSnapshot (AuraPage, HomepageV1, PersonalMemoryMap) set it here.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type LocationTrustValue = 'unknown' | 'low' | 'medium' | 'high' | null;

const SnapshotDebugContext = createContext<{
  locationTrust: LocationTrustValue;
  setLocationTrust: (v: LocationTrustValue) => void;
}>({ locationTrust: null, setLocationTrust: () => {} });

export function SnapshotDebugProvider({ children }: { children: ReactNode }) {
  const [locationTrust, setLocationTrust] = useState<LocationTrustValue>(null);
  const setter = useCallback((v: LocationTrustValue) => setLocationTrust(v), []);
  return (
    <SnapshotDebugContext.Provider value={{ locationTrust, setLocationTrust: setter }}>
      {children}
    </SnapshotDebugContext.Provider>
  );
}

export function useSnapshotDebug() {
  return useContext(SnapshotDebugContext);
}
