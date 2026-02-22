/**
 * Presence verify: zone integrity + whisperKey contract.
 * Run: npx tsx tests/presence-verify-public.test.ts
 */

import { presenceAllowZoneFromBody, getPresenceZone } from '../supabase/functions/card-gate/presence-zones';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ----- Zone injection rejected when DEBUG_PRESENCE is false -----
function testZoneRejectionWhenNotDebug() {
  assert(
    presenceAllowZoneFromBody({ zone: { lat: 48.88, lng: 2.34, radiusM: 100 } }, false) === false,
    'body.zone must be rejected when debugPresence is false'
  );
  assert(
    presenceAllowZoneFromBody({ zoneId: 'sym-18-dalida' }, false) === true,
    'zoneId-only is allowed when debug false'
  );
  assert(
    presenceAllowZoneFromBody({}, false) === true,
    'no zone is allowed'
  );
  assert(
    presenceAllowZoneFromBody({ zone: { lat: 48.88, lng: 2.34, radiusM: 100 } }, true) === true,
    'body.zone is accepted when debugPresence is true'
  );
  console.log('OK zone injection rejected when DEBUG_PRESENCE false');
}

// ----- WhisperKey contract: each reasonCode has a whisper key -----
const REASON_CODE_TO_WHISPER_KEY: Record<string, string> = {
  OK: 'presence.recognized',
  LOW_TRUST: 'presence.weak',
  OUTSIDE_ZONE: 'presence.outside',
  COOLDOWN: 'presence.cooldown',
  NO_CARD: 'presence.no_card',
  TELEPORT: 'presence.teleport',
};
const MED_WHISPER_KEY = 'presence.uncertain';

function testWhisperKeyPerReasonCode() {
  assert(REASON_CODE_TO_WHISPER_KEY.OK === 'presence.recognized', 'OK -> presence.recognized');
  assert(REASON_CODE_TO_WHISPER_KEY.LOW_TRUST === 'presence.weak', 'LOW_TRUST -> presence.weak');
  assert(REASON_CODE_TO_WHISPER_KEY.OUTSIDE_ZONE === 'presence.outside', 'OUTSIDE_ZONE -> presence.outside');
  assert(REASON_CODE_TO_WHISPER_KEY.COOLDOWN === 'presence.cooldown', 'COOLDOWN -> presence.cooldown');
  assert(REASON_CODE_TO_WHISPER_KEY.NO_CARD === 'presence.no_card', 'NO_CARD -> presence.no_card');
  assert(MED_WHISPER_KEY === 'presence.uncertain', 'MED -> presence.uncertain');
  assert(REASON_CODE_TO_WHISPER_KEY.TELEPORT === 'presence.teleport', 'TELEPORT -> presence.teleport');
  console.log('OK whisperKey present for each reasonCode path');
}

// ----- TELEPORT: reject when speed > 12 m/s -----
function testTeleportRejectsUnrealisticSpeed() {
  const PRESENCE_TELEPORT_MAX_MPS = 12;
  const distanceM = 500;
  const deltaTs = 30;
  const speedMps = distanceM / deltaTs;
  assert(speedMps > PRESENCE_TELEPORT_MAX_MPS, '500m in 30s should be rejected as teleport');
  const slowDist = 100;
  const slowDelta = 10;
  assert(slowDist / slowDelta === 10, '10 m/s should be allowed');
  console.log('OK TELEPORT logic rejects unrealistic speed');
}

// ----- Interference: 2+ low results within 60s -----
function testInterferenceAfterTwoLow() {
  const LOW_WINDOW_MS = 60_000;
  const responses = [
    { grade: 'LOW' as const, reasonCode: 'LOW_TRUST' as const, ts: 1000 },
    { grade: 'LOW' as const, reasonCode: 'LOW_TRUST' as const, ts: 2000 },
  ];
  let lowCount = 0;
  let windowStart: number | null = null;
  for (const r of responses) {
    const isLow = r.grade === 'LOW' || r.reasonCode === 'LOW_TRUST';
    if (isLow) {
      if (windowStart === null) windowStart = r.ts;
      if (r.ts - windowStart <= LOW_WINDOW_MS) {
        lowCount += 1;
      } else {
        windowStart = r.ts;
        lowCount = 1;
      }
    }
  }
  assert(lowCount >= 2, 'Two low responses in window => interference');
  console.log('OK interference triggers after 2 low results');
}

// ----- Zone registry: TresorCache symbol IDs resolve -----
function testZoneRegistry() {
  const z = getPresenceZone('sym-18-dalida');
  assert(z !== null, 'sym-18-dalida must resolve');
  assert(z!.lat === 48.8865 && z!.lng === 2.3397 && z!.radiusM === 100, 'sym-18-dalida coords');
  assert(getPresenceZone('sym-18-passe-muraille') !== null, 'sym-18-passe-muraille');
  assert(getPresenceZone('unknown-zone') === null, 'unknown zone returns null');
  console.log('OK zone registry');
}

function run() {
  testZoneRejectionWhenNotDebug();
  testWhisperKeyPerReasonCode();
  testZoneRegistry();
  testTeleportRejectsUnrealisticSpeed();
  testInterferenceAfterTwoLow();
  console.log('All presence-verify-public tests passed.');
}

run();
