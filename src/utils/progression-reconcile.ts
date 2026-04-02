import { emitDiagnostic } from '../lib/runtime-diagnostics';
import { getPendingWritesCount } from './card-gate-client';
import { PROGRESSION_SNAPSHOT_ADAPTERS } from './progression-bootstrap';
import { clearProgressionUxIssue, reportProgressionUxIssue } from './progression-ux-state';
import {
  PROGRESSION_ARTIFACTS,
  canUseCardScopedProgression,
  fetchCardProgressionState,
  getDirtyProgressionArtifacts,
  getProgressionArtifactVersion,
  hasDirtyProgressionWrites,
  hasProgressionWriteInFlight,
  setProgressionArtifactDirty,
  setProgressionArtifactUpdatedAt,
  setProgressionArtifactVersion,
  type ProgressionArtifact,
} from './progression-sync';

export const PROGRESSION_RECONCILE_INTERVAL_MS = 3 * 60 * 1000;

export type ReconcileStatus = 'applied' | 'skipped' | 'deferred' | 'conflict';

export interface ReconcileResult {
  status: ReconcileStatus;
  reason: string;
  appliedArtifacts: ProgressionArtifact[];
  conflictArtifacts: ProgressionArtifact[];
}

export interface ReconcileGate {
  online: boolean;
  visible: boolean;
  writeInFlight: boolean;
}

const reconcileInFlight = new Map<string, Promise<ReconcileResult>>();

function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

function isVisible(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState === 'visible';
}

export function shouldRunProgressionReconcile(gate: ReconcileGate): { allow: boolean; reason: string } {
  if (!gate.online) return { allow: false, reason: 'offline' };
  if (!gate.visible) return { allow: false, reason: 'hidden' };
  if (gate.writeInFlight) return { allow: false, reason: 'write_in_progress' };
  return { allow: true, reason: 'ready' };
}

function emitInfo(code: string, message: string, details: Record<string, unknown>): void {
  emitDiagnostic(
    {
      level: 'info',
      module: 'CardScopedProgression',
      code,
      message,
      details,
    },
    { devOnly: true },
  );
}

function emitWarn(code: string, message: string, details: Record<string, unknown>, onceKey?: string): void {
  emitDiagnostic(
    {
      level: 'warn',
      module: 'CardScopedProgression',
      code,
      message,
      details,
      degraded: true,
    },
    onceKey ? { onceKey } : undefined,
  );
}

function baseResult(status: ReconcileStatus, reason: string): ReconcileResult {
  return {
    status,
    reason,
    appliedArtifacts: [],
    conflictArtifacts: [],
  };
}

async function detectServerNewerDirtyArtifacts(cardId: string, source: string): Promise<ProgressionArtifact[]> {
  const dirtyArtifacts = getDirtyProgressionArtifacts(cardId);
  if (dirtyArtifacts.length === 0) return [];

  const fetchResult = await fetchCardProgressionState(cardId, {
    persistServerMetadata: false,
    source: `${source}.dirtyCheck`,
  });

  if (fetchResult.mode !== 'server') return [];

  const conflicts: ProgressionArtifact[] = [];
  dirtyArtifacts.forEach((artifact) => {
    const serverItem = fetchResult.state.items[artifact];
    if (!serverItem) return;
    const localVersion = getProgressionArtifactVersion(cardId, artifact, 0) ?? 0;
    if (serverItem.version > localVersion) {
      conflicts.push(artifact);
    }
  });

  return conflicts;
}

async function runReconcile(cardId: string, source: string): Promise<ReconcileResult> {
  const gate = shouldRunProgressionReconcile({
    online: isOnline(),
    visible: isVisible(),
    writeInFlight: hasProgressionWriteInFlight(cardId),
  });

  if (!gate.allow) {
    emitInfo('RECONCILE_SKIPPED', 'Progression reconcile skipped due to runtime gate.', {
      cardId,
      source,
      reason: gate.reason,
    });
    return baseResult('skipped', gate.reason);
  }

  const pendingQueueCount = getPendingWritesCount();
  const hasDirty = hasDirtyProgressionWrites(cardId);

  if (pendingQueueCount > 0 || hasDirty) {
    const conflictArtifacts = await detectServerNewerDirtyArtifacts(cardId, source);

    if (conflictArtifacts.length > 0) {
      emitWarn('RECONCILE_CONFLICT', 'Reconcile detected newer server progression while local state is pending.', {
        cardId,
        source,
        conflictArtifacts,
      });

      reportProgressionUxIssue({
        cardId,
        code: 'RECONCILE_REQUIRED',
        message: 'Server progression is newer than local pending state. Resync is required before retry.',
        recoverable: true,
        details: {
          source,
          pendingQueueCount,
          conflictArtifacts,
        },
      });
    }

    emitWarn(
      'RECONCILE_DEFERRED_PENDING_LOCAL_STATE',
      'Reconcile deferred because local pending state must be preserved.',
      {
        cardId,
        source,
        pendingQueueCount,
        dirtyArtifacts: getDirtyProgressionArtifacts(cardId),
      },
      `CardScopedProgression:RECONCILE_DEFERRED:${cardId}:${pendingQueueCount}:${hasDirty ? 'dirty' : 'clean'}`,
    );

    if (conflictArtifacts.length === 0) {
      reportProgressionUxIssue({
        cardId,
        code: 'LOCAL_DIRTY_DEFERRED',
        message: 'Local progression changes are still pending. Reconcile will retry automatically.',
        recoverable: true,
        details: {
          source,
          pendingQueueCount,
          dirtyArtifacts: getDirtyProgressionArtifacts(cardId),
        },
      });
    }

    return {
      status: conflictArtifacts.length > 0 ? 'conflict' : 'deferred',
      reason: 'pending_local_state',
      appliedArtifacts: [],
      conflictArtifacts,
    };
  }

  emitInfo('RECONCILE_STARTED', 'Progression reconcile started.', {
    cardId,
    source,
  });

  const fetchResult = await fetchCardProgressionState(cardId, {
    persistServerMetadata: false,
    source: `${source}.fetch`,
  });

  if (fetchResult.mode !== 'server') {
    emitWarn(
      'RECONCILE_SKIPPED',
      'Progression reconcile skipped because server state is unavailable.',
      {
        cardId,
        source,
        reason: 'server_unavailable',
        error: fetchResult.error ?? null,
      },
      `CardScopedProgression:RECONCILE_SKIPPED_SERVER:${cardId}`,
    );
    return baseResult('skipped', 'server_unavailable');
  }

  const appliedArtifacts: ProgressionArtifact[] = [];
  const conflictArtifacts: ProgressionArtifact[] = [];

  PROGRESSION_ARTIFACTS.forEach((artifact) => {
    const serverItem = fetchResult.state.items[artifact];
    if (!serverItem) return;

    const localVersion = getProgressionArtifactVersion(cardId, artifact, 0) ?? 0;
    if (serverItem.version <= localVersion) return;

    const applied = PROGRESSION_SNAPSHOT_ADAPTERS[artifact].apply(
      serverItem.payload,
      serverItem.updated_at,
      `CardScopedProgression.reconcile.${source}.${artifact}`,
    );

    if (!applied) {
      conflictArtifacts.push(artifact);
      return;
    }

    setProgressionArtifactVersion(cardId, artifact, serverItem.version);
    setProgressionArtifactUpdatedAt(artifact, serverItem.updated_at);
    setProgressionArtifactDirty(cardId, artifact, false);
    appliedArtifacts.push(artifact);
  });

  if (conflictArtifacts.length > 0) {
    emitWarn('RECONCILE_CONFLICT', 'Reconcile could not safely apply all newer server artifacts.', {
      cardId,
      source,
      conflictArtifacts,
    });

    reportProgressionUxIssue({
      cardId,
      code: 'RECONCILE_REQUIRED',
      message: 'Progression could not be fully reconciled. Please retry sync.',
      recoverable: true,
      details: {
        source,
        conflictArtifacts,
      },
    });

    return {
      status: 'conflict',
      reason: 'apply_failed',
      appliedArtifacts,
      conflictArtifacts,
    };
  }

  if (appliedArtifacts.length > 0) {
    emitInfo('RECONCILE_APPLIED', 'Reconcile applied newer server progression state.', {
      cardId,
      source,
      appliedArtifacts,
    });

    if (!hasDirtyProgressionWrites(cardId)) {
      clearProgressionUxIssue(cardId);
    }

    return {
      status: 'applied',
      reason: 'server_newer',
      appliedArtifacts,
      conflictArtifacts: [],
    };
  }

  emitInfo('RECONCILE_SKIPPED', 'Reconcile skipped because local state is already current.', {
    cardId,
    source,
    reason: 'up_to_date',
  });

  if (!hasDirtyProgressionWrites(cardId)) {
    clearProgressionUxIssue(cardId);
  }

  return baseResult('skipped', 'up_to_date');
}

export async function reconcileCardScopedProgression(cardId: string | null | undefined, source = 'interval'): Promise<ReconcileResult> {
  if (!canUseCardScopedProgression(cardId)) {
    emitWarn(
      'RECONCILE_SKIPPED',
      'Reconcile skipped because card session is missing or invalid.',
      {
        cardId,
        source,
        reason: 'invalid_card_session',
      },
      `CardScopedProgression:RECONCILE_INVALID_SESSION:${String(cardId)}`,
    );

    return baseResult('skipped', 'invalid_card_session');
  }

  if (reconcileInFlight.has(cardId)) {
    return reconcileInFlight.get(cardId)!;
  }

  const task = runReconcile(cardId, source).finally(() => {
    reconcileInFlight.delete(cardId);
  });

  reconcileInFlight.set(cardId, task);
  return task;
}

export function resetProgressionReconcileStateForTests(): void {
  reconcileInFlight.clear();
}
