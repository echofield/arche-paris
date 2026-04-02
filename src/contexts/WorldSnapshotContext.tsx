import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, clearApiCache, type WorldSnapshotData, type ZoneProgressData } from '../lib/api';
import { emitDiagnostic } from '../lib/runtime-diagnostics';
import { normalizeWorldSnapshotData, normalizeZoneProgressData } from '../lib/runtime-normalization';

interface WorldSnapshotState {
  snapshot: WorldSnapshotData | null;
  zoneProgress: ZoneProgressData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshZoneProgress: () => Promise<void>;
}

const Ctx = createContext<WorldSnapshotState | null>(null);

export function useWorldSnapshot(): WorldSnapshotState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWorldSnapshot must be used inside WorldSnapshotProvider');
  return ctx;
}

export function WorldSnapshotProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<WorldSnapshotData | null>(null);
  const [zoneProgress, setZoneProgress] = useState<ZoneProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    const res = await api.worldSnapshot({ include: 'map,champ,law', h3_center: 'PAR-10', k: 10 });
    if (res.data) {
      const normalized = normalizeWorldSnapshotData(res.data, 'WorldSnapshotContext.fetchSnapshot');
      if (normalized) {
        setSnapshot(normalized);
        setError(null);
        emitDiagnostic(
          {
            level: 'info',
            module: 'WorldSnapshotContext',
            code: 'SNAPSHOT_HYDRATED',
            message: 'World snapshot hydrated.',
            details: {
              authenticated: normalized.me.authenticated,
              cardId: normalized.me.card_id,
              zoneCount: normalized.world.zones.length,
              inscriptionCount: normalized.world.map.inscriptions.length,
            },
          },
          { devOnly: true },
        );
      } else if (!snapshot) {
        setError('Invalid world snapshot payload');
      }
      return;
    }

    if (res.error) {
      if (!snapshot) setError(res.error);
      emitDiagnostic(
        {
          level: 'warn',
          module: 'WorldSnapshotContext',
          code: 'SNAPSHOT_FETCH_FAILED',
          message: 'Failed to fetch world snapshot.',
          details: { error: res.error },
          degraded: true,
        },
        { onceKey: `WorldSnapshotContext:SNAPSHOT_FETCH_FAILED:${res.error}` },
      );
    }
  }, [snapshot]);

  const fetchZoneProgress = useCallback(async () => {
    const res = await api.zoneProgress();
    if (res.data) {
      const normalized = normalizeZoneProgressData(res.data, 'WorldSnapshotContext.fetchZoneProgress');
      setZoneProgress(normalized);
      emitDiagnostic(
        {
          level: 'info',
          module: 'WorldSnapshotContext',
          code: 'ZONE_PROGRESS_HYDRATED',
          message: 'Zone progress hydrated.',
          details: {
            zoneCount: normalized.zones.length,
            totalObjectives: normalized.stats.total_objectives,
          },
        },
        { devOnly: true },
      );
      return;
    }

    if (res.error) {
      emitDiagnostic(
        {
          level: 'warn',
          module: 'WorldSnapshotContext',
          code: 'ZONE_PROGRESS_FETCH_FAILED',
          message: 'Failed to fetch zone progress.',
          details: { error: res.error },
          degraded: true,
        },
        { onceKey: `WorldSnapshotContext:ZONE_PROGRESS_FETCH_FAILED:${res.error}` },
      );
    }
  }, []);

  const refresh = useCallback(async () => {
    clearApiCache('world/snapshot');
    clearApiCache('zone-progress');
    setLoading(true);
    await Promise.all([fetchSnapshot(), fetchZoneProgress()]);
    setLoading(false);
  }, [fetchSnapshot, fetchZoneProgress]);

  const refreshZoneProgress = useCallback(async () => {
    clearApiCache('zone-progress');
    await fetchZoneProgress();
  }, [fetchZoneProgress]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([fetchSnapshot(), fetchZoneProgress()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Ctx.Provider value={{ snapshot, zoneProgress, loading, error, refresh, refreshZoneProgress }}>
      {children}
    </Ctx.Provider>
  );
}

