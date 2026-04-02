import { emitDiagnostic } from '../lib/runtime-diagnostics';
import { applyCollectionSyncSnapshot, getCollectionSyncSnapshot } from './collection-service';
import { applyQuestRunSyncSnapshot, getQuestRunSyncSnapshot } from './quest-run-service';
import {
  PROGRESSION_ARTIFACTS,
  canUseCardScopedProgression,
  fetchCardProgressionState,
  setProgressionArtifactDirty,
  type ProgressionArtifact,
  type ProgressionEntryInput,
  pushCardProgressionState,
} from './progression-sync';
import { applyTraceSyncSnapshot, getTraceSyncSnapshot } from './trace-service';
import { applyWalkSyncSnapshot, getWalkSyncSnapshot } from './walk-service';

interface LocalProgressionSnapshot {
  payload: unknown;
  updatedAt: string;
}

export type ProgressionSnapshotAdapter = {
  read: () => LocalProgressionSnapshot | null;
  apply: (payload: unknown, updatedAt: string, source: string) => boolean;
};

export type ProgressionMergeAction = 'upload' | 'pull' | 'skip';

const MIGRATION_STATE_PREFIX = 'arche_progression_migration_v1:';
const bootstrapInFlight = new Map<string, Promise<void>>();

export const PROGRESSION_SNAPSHOT_ADAPTERS: Record<ProgressionArtifact, ProgressionSnapshotAdapter> = {
  collection: {
    read: getCollectionSyncSnapshot,
    apply: applyCollectionSyncSnapshot,
  },
  traces: {
    read: getTraceSyncSnapshot,
    apply: applyTraceSyncSnapshot,
  },
  walks: {
    read: getWalkSyncSnapshot,
    apply: applyWalkSyncSnapshot,
  },
  quest_runs: {
    read: getQuestRunSyncSnapshot,
    apply: applyQuestRunSyncSnapshot,
  },
};

function readStorage(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors.
  }
}

function toMillis(value: string | null | undefined): number | null {
  if (typeof value !== 'string') return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return ts;
}

function migrationStateKey(cardId: string): string {
  return `${MIGRATION_STATE_PREFIX}${cardId}`;
}

export function decideProgressionMergeAction(
  localUpdatedAt: string | null | undefined,
  serverUpdatedAt: string | null | undefined,
): ProgressionMergeAction {
  const localTs = toMillis(localUpdatedAt);
  const serverTs = toMillis(serverUpdatedAt);

  if (localTs == null && serverTs == null) return 'skip';
  if (localTs == null) return 'pull';
  if (serverTs == null) return 'upload';
  if (localTs > serverTs) return 'upload';
  if (serverTs > localTs) return 'pull';
  return 'skip';
}

function emitMigrationInfo(code: string, message: string, details: Record<string, unknown>): void {
  emitDiagnostic({
    level: 'info',
    module: 'CardScopedProgression',
    code,
    message,
    details,
  });
}

function emitMigrationWarning(code: string, message: string, details: Record<string, unknown>, onceKey?: string): void {
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

async function runBootstrap(cardId: string): Promise<void> {
  const migrationKey = migrationStateKey(cardId);
  const hasMigrated = readStorage(migrationKey) != null;

  if (!hasMigrated) {
    emitMigrationInfo('MIGRATION_STARTED', 'Card-scoped progression migration started.', {
      cardId,
      artifacts: PROGRESSION_ARTIFACTS,
    });
  }

  const fetchResult = await fetchCardProgressionState(cardId, {
    source: 'bootstrap.fetch',
    persistServerMetadata: true,
  });

  if (fetchResult.mode !== 'server') {
    emitMigrationWarning(
      'FALLBACK_LOCAL_MODE',
      'Card-scoped progression migration fell back to local mode.',
      {
        cardId,
        error: fetchResult.error ?? null,
      },
      `CardScopedProgression:FALLBACK_LOCAL_MODE:bootstrap:${cardId}`,
    );

    if (!hasMigrated) {
      emitMigrationInfo('MIGRATION_SKIPPED', 'Migration skipped because server state was unavailable.', {
        cardId,
        reason: 'server_unavailable',
      });
    }
    return;
  }

  const localSnapshots: Partial<Record<ProgressionArtifact, LocalProgressionSnapshot>> = {};
  PROGRESSION_ARTIFACTS.forEach((artifact) => {
    const snapshot = PROGRESSION_SNAPSHOT_ADAPTERS[artifact].read();
    if (!snapshot) return;
    localSnapshots[artifact] = snapshot;
  });

  const uploadEntries: ProgressionEntryInput[] = [];
  const pullArtifacts: ProgressionArtifact[] = [];

  PROGRESSION_ARTIFACTS.forEach((artifact) => {
    const localSnapshot = localSnapshots[artifact] ?? null;
    const serverSnapshot = fetchResult.state.items[artifact] ?? null;

    const action = decideProgressionMergeAction(
      localSnapshot?.updatedAt ?? null,
      serverSnapshot?.updated_at ?? null,
    );

    if (action === 'upload' && localSnapshot) {
      uploadEntries.push({
        artifact,
        payload: localSnapshot.payload,
        client_updated_at: localSnapshot.updatedAt,
        base_version: serverSnapshot?.version ?? 0,
      });
      return;
    }

    if (action === 'pull' && serverSnapshot) {
      pullArtifacts.push(artifact);
    }
  });

  let pulled = 0;
  pullArtifacts.forEach((artifact) => {
    const serverSnapshot = fetchResult.state.items[artifact];
    if (!serverSnapshot) return;
    const applied = PROGRESSION_SNAPSHOT_ADAPTERS[artifact].apply(
      serverSnapshot.payload,
      serverSnapshot.updated_at,
      `CardScopedProgression.bootstrap.pull.${artifact}`,
    );
    if (applied) {
      pulled += 1;
      setProgressionArtifactDirty(cardId, artifact, false);
    }
  });

  let uploaded = 0;
  let conflicts = 0;

  if (uploadEntries.length > 0) {
    const pushResult = await pushCardProgressionState(cardId, uploadEntries, 'CardScopedProgression.bootstrap');

    if (pushResult.mode !== 'server') {
      emitMigrationWarning(
        'FALLBACK_LOCAL_MODE',
        'Card-scoped progression upload fell back to local mode.',
        {
          cardId,
          error: pushResult.error ?? null,
        },
        `CardScopedProgression:FALLBACK_LOCAL_MODE:bootstrap-upload:${cardId}`,
      );
    } else {
      uploaded = pushResult.applied.length;
      conflicts = pushResult.conflicts.length;

      pushResult.applied.forEach((artifact) => {
        setProgressionArtifactDirty(cardId, artifact, false);
      });

      if (conflicts > 0) {
        emitMigrationWarning('CONFLICT_DETECTED', 'Progression migration detected newer server data; local overwrite was blocked.', {
          cardId,
          conflicts: pushResult.conflicts,
        });

        pushResult.conflicts.forEach((conflict) => {
          const serverSnapshot = pushResult.state.items[conflict.artifact];
          if (!serverSnapshot) return;
          PROGRESSION_SNAPSHOT_ADAPTERS[conflict.artifact].apply(
            serverSnapshot.payload,
            serverSnapshot.updated_at,
            `CardScopedProgression.bootstrap.conflict.${conflict.artifact}`,
          );
          setProgressionArtifactDirty(cardId, conflict.artifact, false);
        });
      }
    }
  }

  const didReconcile = uploadEntries.length > 0 || pullArtifacts.length > 0;

  if (!hasMigrated) {
    writeStorage(
      migrationKey,
      JSON.stringify({
        completed_at: new Date().toISOString(),
        uploaded,
        pulled,
        conflicts,
      }),
    );

    if (didReconcile) {
      emitMigrationInfo('MIGRATION_SUCCEEDED', 'Card-scoped progression migration succeeded.', {
        cardId,
        uploaded,
        pulled,
        conflicts,
      });
    } else {
      emitMigrationInfo('MIGRATION_SKIPPED', 'Card-scoped progression migration skipped because no local/server delta was found.', {
        cardId,
        reason: 'already_in_sync',
      });
    }

    return;
  }

  emitMigrationInfo('MIGRATION_SKIPPED', 'Card-scoped progression migration already completed for this card.', {
    cardId,
    reconciledThisSession: didReconcile,
    uploaded,
    pulled,
    conflicts,
  });
}

export async function bootstrapCardScopedProgression(cardId: string | null | undefined): Promise<void> {
  if (!canUseCardScopedProgression(cardId)) return;

  if (bootstrapInFlight.has(cardId)) {
    await bootstrapInFlight.get(cardId);
    return;
  }

  const task = runBootstrap(cardId)
    .catch((error) => {
      emitMigrationWarning(
        'BOOTSTRAP_FAILED',
        'Unexpected card-scoped progression bootstrap failure.',
        {
          cardId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    })
    .finally(() => {
      bootstrapInFlight.delete(cardId);
    });

  bootstrapInFlight.set(cardId, task);
  await task;
}

export function resetProgressionBootstrapForTests(): void {
  bootstrapInFlight.clear();
}
