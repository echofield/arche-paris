import assert from 'node:assert/strict';
import {
  buildZoneProgressMap,
  normalizeWorldSnapshotData,
  normalizeZoneProgressData,
} from '../src/lib/runtime-normalization';
import { resetDiagnosticsForTests } from '../src/lib/runtime-diagnostics';
import { normalizeProgressionStatePayload } from '../src/utils/progression-sync';

resetDiagnosticsForTests();

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

const BASE_ZONE = {
  entered: true,
  entered_at: null,
  presence_ritual: false,
  presence_ritual_at: null,
  observation_ritual: false,
  observation_ritual_at: null,
  engraved: false,
  engraved_at: null,
  is_custodian: false,
  custodian_since: null,
  custody_expires_at: null,
  objectives_complete: 1,
  updated_at: '2026-04-02T00:00:00.000Z',
};

run('zone-progress: non-array zones fallback does not crash and emits warning', () => {
  const warns = captureWarns(() => {
    const normalized = normalizeZoneProgressData(
      {
        zones: { invalid: true },
        stats: {},
        complexion: {},
      },
      'tests.contract.nonArrayZones',
    );

    assert.deepEqual(normalized.zones, []);
    assert.equal(normalized.stats.total_zones_touched, 0);
  });

  assert.ok(warns.some((line) => line.includes('MISSING_ZONES_ARRAY')));
});

run('zone-progress: mixed legacy/canonical ids normalize into one safe map', () => {
  const normalized = normalizeZoneProgressData(
    {
      zones: [
        { ...BASE_ZONE, zone_id: 'paris-7' },
        { ...BASE_ZONE, zone_id: 'PAR-07' },
      ],
      stats: {},
      complexion: {},
    },
    'tests.contract.mixedZoneIds',
  );

  const map = buildZoneProgressMap(normalized, 'tests.contract.mixedZoneIds');
  assert.ok(map['PAR-07']);
  assert.ok(map['paris-7']);
  assert.equal(map['PAR-07'].zone_id, 'PAR-07');
});

run('zone-progress: invalid records are dropped instead of poisoning render data', () => {
  const warns = captureWarns(() => {
    const normalized = normalizeZoneProgressData(
      {
        zones: [
          { bad: true },
          { ...BASE_ZONE, zone_id: 'PAR-11' },
        ],
        stats: {},
        complexion: {},
      },
      'tests.contract.invalidZoneRecords',
    );

    assert.equal(normalized.zones.length, 1);
    assert.equal(normalized.zones[0].zone_id, 'PAR-11');
  });

  assert.ok(warns.some((line) => line.includes('ZONE_ITEMS_DROPPED')));
});

run('world snapshot: empty map/champ sections hydrate to safe defaults', () => {
  const normalized = normalizeWorldSnapshotData(
    {
      now: '2026-04-02T00:00:00.000Z',
      policy: {
        world_version: 'v-contract',
        cache: {
          public_s_maxage: 30,
          public_swr: 60,
        },
      },
      world: {
        zones: [],
        map: {},
        champ: {},
      },
      me: {
        authenticated: true,
        card_id: 'PS-0001',
        zones: {},
      },
    },
    'tests.contract.emptySnapshotSections',
  );

  assert.ok(normalized);
  assert.deepEqual(normalized?.world.zones, []);
  assert.deepEqual(normalized?.world.map.inscriptions, []);
  assert.deepEqual(normalized?.world.champ.items, []);
});

run('world snapshot: truthy proxy drift payload (HTTP 200 wrong shape) fails closed', () => {
  const warns = captureWarns(() => {
    const normalized = normalizeWorldSnapshotData(
      {
        status: 'Card Gate proxy active',
      },
      'tests.contract.proxyDrift',
    );

    assert.equal(normalized, null);
  });

  assert.ok(warns.some((line) => line.includes('MISSING_WORLD_OR_ME')));
});

run('progression payload: missing optional fields normalize safely', () => {
  const normalized = normalizeProgressionStatePayload(
    {
      items: {
        collection: {
          payload: {
            cardId: 'PS-0001',
            symbols: [{ symbolId: 'alpha', foundAt: '2026-04-02T00:00:00.000Z' }],
          },
        },
      },
    },
    'tests.contract.progressionOptionalFields',
  );

  assert.ok(normalized.items.collection);
  assert.equal(typeof normalized.items.collection?.updated_at, 'string');
  assert.deepEqual(normalized.conflicts, []);
});

run('progression payload: wrong-shape truthy body degrades safely to empty items', () => {
  const warns = captureWarns(() => {
    const normalized = normalizeProgressionStatePayload(
      {
        ok: true,
        status: 'proxy active',
      },
      'tests.contract.progressionWrongShape',
    );

    assert.deepEqual(normalized.items, {});
  });

  assert.ok(warns.some((line) => line.includes('MISSING_ITEMS_OBJECT')));
});
run('progression payload: invalid version values fall back safely', () => {
  const normalized = normalizeProgressionStatePayload(
    {
      items: {
        traces: {
          payload: { legacy: [], v1: [] },
          updated_at: 'invalid-date',
          version: 'not-a-number',
        },
      },
    },
    'tests.contract.progressionInvalidVersion',
  );
  assert.equal(normalized.items.traces?.version, 0);
  assert.equal(normalized.items.traces?.updated_at, '1970-01-01T00:00:00.000Z');
});
run('progression payload: malformed conflicts are dropped without crashing', () => {
  const normalized = normalizeProgressionStatePayload(
    {
      items: {},
      conflicts: [
        { artifact: 'unknown', server_updated_at: '2026-04-02T00:00:00.000Z' },
        { artifact: 'walks', server_updated_at: '2026-04-02T00:00:00.000Z', server_version: 2 },
      ],
    },
    'tests.contract.progressionMalformedConflicts',
  );
  assert.equal(normalized.conflicts.length, 1);
  assert.equal(normalized.conflicts[0].artifact, 'walks');
  assert.equal(normalized.conflicts[0].server_version, 2);
});
if (process.exitCode) {
  process.exit(process.exitCode);
}

