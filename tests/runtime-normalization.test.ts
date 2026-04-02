import assert from 'node:assert/strict';
import {
  buildZoneProgressMap,
  normalizeWorldSnapshotData,
  normalizeZoneProgressData,
  zoneIdToArrondissement,
} from '../src/lib/runtime-normalization';
import { resetDiagnosticsForTests } from '../src/lib/runtime-diagnostics';

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

run('reproduces original forEach crash path', () => {
  const malformed: { zones?: Array<{ zone_id: string }> } = {};

  assert.throws(() => {
    const map: Record<string, unknown> = {};
    // Historical failing line from PersonalMemoryMap before hardening.
    malformed.zones!.forEach((zone) => {
      map[zone.zone_id] = zone;
    });
  }, /forEach/);
});

run('normalizes missing zones array to safe empty data', () => {
  const normalized = normalizeZoneProgressData(
    {
      ok: true,
      stats: {},
      complexion: {},
    },
    'tests.zoneProgress.missingZones',
  );

  assert.deepEqual(normalized.zones, []);
  assert.equal(normalized.stats.total_zones_touched, 0);
  assert.equal(normalized.complexion.revealed, false);
});

run('builds zone progress map with canonical and legacy zone keys', () => {
  const normalized = normalizeZoneProgressData(
    {
      zones: [
        {
          zone_id: 'paris-3',
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
        },
      ],
      stats: {},
      complexion: {},
    },
    'tests.zoneProgress.legacyId',
  );

  const map = buildZoneProgressMap(normalized, 'tests.zoneProgress.legacyId');
  assert.ok(map['PAR-03']);
  assert.ok(map['paris-3']);
  assert.equal(map['PAR-03'].zone_id, 'PAR-03');
});

run('normalizes partial world snapshot payload', () => {
  const normalized = normalizeWorldSnapshotData(
    {
      now: '2026-04-02T00:00:00.000Z',
      policy: {
        world_version: 'v-test',
        cache: {
          public_s_maxage: 10,
          public_swr: 20,
        },
      },
      world: {
        zones: [
          {
            h3: 'PAR-10',
            title: '10e',
            fog: { level: 0.2 },
            signals: { inscriptions_recent: 2, champ_recent: 1 },
            law: {},
          },
        ],
        map: {
          inscriptions: [
            {
              id: 'ins-1',
              h3: 'PAR-10',
              ts: '2026-04-02T00:00:00.000Z',
              excerpt: 'line',
            },
          ],
        },
        champ: {
          items: [
            {
              id: 'ch-1',
              h3: 'PAR-10',
              ts: '2026-04-02T00:00:00.000Z',
              excerpt: 'champ',
            },
          ],
        },
      },
      me: {
        authenticated: true,
        card_id: 'PS-0001',
        zones: {
          'PAR-10': {
            progress: {
              zone_id: 'paris-10',
              entered: true,
              entered_at: null,
              engraved: false,
              engraved_at: null,
            },
            activation: null,
          },
        },
      },
    },
    'tests.worldSnapshot.partial',
  );

  assert.ok(normalized);
  assert.equal(normalized?.world.zones.length, 1);
  assert.equal(normalized?.world.map.inscriptions.length, 1);
  assert.equal(normalized?.me.zones['PAR-10']?.progress?.zone_id, 'PAR-10');
});

run('parses both zone id formats', () => {
  assert.equal(zoneIdToArrondissement('PAR-07'), 7);
  assert.equal(zoneIdToArrondissement('paris-7'), 7);
  assert.equal(zoneIdToArrondissement('not-a-zone'), null);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

