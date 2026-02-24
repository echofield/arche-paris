/**
 * ARCHÉ — Sync state: one source of truth for pending count, syncing, last sync, errors.
 * Carnet, Traces, My Paris use this instead of each inventing their own sync logic.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getPendingWritesCount,
  flushPendingWrites,
  subscribeToQueueChange,
  getLastCompressedAt,
  getPendingCardIds,
  COMPRESSED_MESSAGE,
} from '../utils/card-gate-client';

const COMPRESSED_MESSAGE_TTL_MS = 10_000;

export interface SyncState {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
  /** True when queue was recently trimmed (show COMPRESSED_MESSAGE). */
  showCompressedMessage: boolean;
  flushNow: (cardId: string) => Promise<number>;
}

const SyncStateContext = createContext<SyncState | null>(null);

export function SyncStateProvider({ children }: { children: React.ReactNode }) {
  const [pendingCount, setPendingCount] = useState(getPendingWritesCount);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastCompressedAt, setLastCompressedAt] = useState(0);

  useEffect(() => {
    const unsub = subscribeToQueueChange(() => {
      setPendingCount(getPendingWritesCount());
      setLastCompressedAt(getLastCompressedAt());
    });
    return unsub;
  }, []);

  const flushNow = useCallback(async (cardId: string): Promise<number> => {
    setIsSyncing(true);
    setLastError(null);
    try {
      const sent = await flushPendingWrites(cardId);
      if (sent > 0) setLastSyncAt(Date.now());
      return sent;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLastError(msg);
      return 0;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Flush all pending cards when connection returns
  useEffect(() => {
    const onOnline = () => {
      const cardIds = getPendingCardIds();
      if (cardIds.length === 0) return;
      cardIds.forEach((cid) => flushPendingWrites(cid));
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const showCompressedMessage = lastCompressedAt > 0 && lastCompressedAt > Date.now() - COMPRESSED_MESSAGE_TTL_MS;

  const value = useMemo<SyncState>(
    () => ({
      pendingCount,
      isSyncing,
      lastSyncAt,
      lastError,
      showCompressedMessage,
      flushNow,
    }),
    [pendingCount, isSyncing, lastSyncAt, lastError, showCompressedMessage, flushNow]
  );

  return (
    <SyncStateContext.Provider value={value}>
      {children}
    </SyncStateContext.Provider>
  );
}

export function useSyncState(): SyncState {
  const ctx = useContext(SyncStateContext);
  if (!ctx) throw new Error('useSyncState must be used within SyncStateProvider');
  return ctx;
}

export { COMPRESSED_MESSAGE };
