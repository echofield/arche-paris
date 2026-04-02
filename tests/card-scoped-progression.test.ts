import assert from 'node:assert/strict';
import { applyCollectionSyncSnapshot, getCollection } from '../src/utils/collection-service';
import { decideProgressionMergeAction } from '../src/utils/progression-bootstrap';
import { resetDiagnosticsForTests } from '../src/lib/runtime-diagnostics';
import {
  getDirtyProgressionArtifacts,
  getProgressionArtifactVersion,
  normalizeProgressionStatePayload,
  resetProgressionSyncStateForTests,
  setProgressionArtifactDirty,
  setProgressionArtifactVersion,
} from '../src/utils/progression-sync';
import {
  applyQuestRunSyncSnapshot,
  getActiveRun,
  getRuns,
  isTemporalMeridiansUnlocked,
} from '../src/utils/quest-run-service';
import { applyTraceSyncSnapshot, listTraces, loadTracesV1 } from '../src/utils/trace-service';
import { applyWalkSyncSnapshot, getMilestonesSeen, loadWalkLogPublic } from '../src/utils/walk-service';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

(globalThis as unknown as { localStorage: Storage }).localStorage = new MemoryStorage();

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

function resetTestState(): void {
  localStorage.clear();
  resetDiagnosticsForTests();
  resetProgressionSyncStateForTests();
}

function captureWarns(fn: () => void): string[] {
  const originalWarn = console.warn;
  const calls: string[] = [];
  console.warn = (...args: unknown[]) => {
    calls.push(String(args[0] ?? ''));
  };
  try {
    fn();
  } finally {
    console.warn = originalWarn;
  }
  return calls;
}

run('merge strategy respects updated_at precedence', () => {
  assert.equal(decideProgressionMergeAction('2026-04-02T10:00:00.000Z', '2026-04-01T10:00:00.000Z'), 'upload');
  assert.equal(decideProgressionMergeAction('2026-04-01T10:00:00.000Z', '2026-04-02T10:00:00.000Z'), 'pull');
  assert.equal(decideProgressionMergeAction('2026-04-02T10:00:00.000Z', '2026-04-02T10:00:00.000Z'), 'skip');
  assert.equal(decideProgressionMergeAction('2026-04-02T10:00:00.000Z', null), 'upload');
  assert.equal(decideProgressionMergeAction(null, '2026-04-02T10:00:00.000Z'), 'pull');
});

run('collection sync snapshot drops invalid records and preserves valid symbols', () => {
  resetTestState();
  localStorage.setItem('arche_card_id', 'PS-0042');

  const warns = captureWarns(() => {
    const applied = applyCollectionSyncSnapshot(
      {
        symbols: [
          { symbolId: 'alpha', foundAt: '2026-04-02T00:00:00.000Z' },
          { malformed: true },
        ],
      },
      '2026-04-02T12:00:00.000Z',
      'tests.collection',
    );

    assert.equal(applied, true);
  });

  const collection = getCollection();
  assert.ok(collection);
  assert.equal(collection?.cardId, 'PS-0042');
  assert.equal(collection?.symbols.length, 1);
  assert.equal(collection?.symbols[0].symbolId, 'alpha');
  assert.equal(collection?.lastUpdated, '2026-04-02T12:00:00.000Z');
  assert.ok(warns.some((line) => line.includes('INVALID_SYMBOL_ITEM')));
});

run('trace sync snapshot handles missing optional legacy array and drops bad v1 stamps', () => {
  resetTestState();

  const warns = captureWarns(() => {
    const applied = applyTraceSyncSnapshot(
      {
        v1: [
          {
            traceId: 'thread-1',
            questId: 'quest-a',
            title: 'Quest A',
            createdAt: '2026-04-02T08:00:00.000Z',
            stamps: [
              { stopId: 's1', label: 'Stop 1', at: '2026-04-02T08:05:00.000Z' },
              { broken: true },
            ],
          },
        ],
      },
      '2026-04-02T09:00:00.000Z',
      'tests.traces',
    );

    assert.equal(applied, true);
  });

  assert.equal(listTraces().length, 0);
  const v1 = loadTracesV1();
  assert.equal(v1.length, 1);
  assert.equal(v1[0].stamps.length, 1);
  assert.equal(v1[0].stamps[0].stopId, 's1');
  assert.ok(warns.some((line) => line.includes('MISSING_LEGACY_ARRAY')));
});

run('walk sync snapshot tolerates missing milestones and malformed entries', () => {
  resetTestState();

  const applied = applyWalkSyncSnapshot(
    {
      log: {
        '2026-04-01': {
          date: '2026-04-01',
          entries: [
            { kind: 'manual', label: 'River walk', at: '2026-04-01T10:00:00.000Z', approxKm: 2.5 },
            { broken: true },
          ],
        },
      },
    },
    '2026-04-02T09:30:00.000Z',
    'tests.walks',
  );

  assert.equal(applied, true);

  const log = loadWalkLogPublic();
  assert.ok(log['2026-04-01']);
  assert.equal(log['2026-04-01'].entries.length, 1);
  assert.equal(log['2026-04-01'].approxKm, 2.5);
  assert.deepEqual(getMilestonesSeen(), []);
});

run('quest-run sync snapshot preserves visited state and drops malformed runs', () => {
  resetTestState();

  const applied = applyQuestRunSyncSnapshot(
    {
      runs: [
        {
          runId: 'run-1',
          questId: 'temporal-meridians',
          startedAt: '2026-04-02T07:00:00.000Z',
          visited: {
            nodeA: { at: '2026-04-02T07:05:00.000Z' },
          },
          closedAt: '2026-04-02T07:30:00.000Z',
        },
        {
          invalid: true,
        },
      ],
      activeRunId: 'run-1',
      temporalMeridiansUnlocked: true,
    },
    '2026-04-02T10:00:00.000Z',
    'tests.questRuns',
  );

  assert.equal(applied, true);
  assert.equal(getRuns().length, 1);
  assert.equal(getRuns()[0].runId, 'run-1');
  assert.equal(getActiveRun()?.runId, 'run-1');
  assert.equal(isTemporalMeridiansUnlocked(), true);
});
run('progression payload parses versioned state and conflict metadata safely', () => {
  resetTestState();
  const normalized = normalizeProgressionStatePayload(
    {
      items: {
        collection: {
          payload: { symbols: [] },
          updated_at: '2026-04-02T12:00:00.000Z',
          client_updated_at: '2026-04-02T11:59:00.000Z',
          version: '3',
        },
      },
      conflicts: [
        {
          artifact: 'collection',
          server_updated_at: '2026-04-02T12:05:00.000Z',
          server_version: '4',
          reason: 'BASE_VERSION_MISMATCH',
        },
      ],
    },
    'tests.progression.versionedPayload',
  );
  assert.equal(normalized.items.collection?.version, 3);
  assert.equal(normalized.items.collection?.client_updated_at, '2026-04-02T11:59:00.000Z');
  assert.equal(normalized.conflicts.length, 1);
  assert.equal(normalized.conflicts[0].artifact, 'collection');
  assert.equal(normalized.conflicts[0].server_version, 4);
  assert.equal(normalized.conflicts[0].reason, 'BASE_VERSION_MISMATCH');
});
run('progression sync metadata stores server version and dirty artifact markers', () => {
  resetTestState();
  setProgressionArtifactVersion('PS-0999', 'walks', 7);
  setProgressionArtifactDirty('PS-0999', 'walks', true);
  assert.equal(getProgressionArtifactVersion('PS-0999', 'walks', 0), 7);
  assert.deepEqual(getDirtyProgressionArtifacts('PS-0999'), ['walks']);
  setProgressionArtifactDirty('PS-0999', 'walks', false);
  assert.deepEqual(getDirtyProgressionArtifacts('PS-0999'), []);
});
if (process.exitCode) {
  process.exit(process.exitCode);
}

