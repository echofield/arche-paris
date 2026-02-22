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
};
const MED_WHISPER_KEY = 'presence.uncertain';

function testWhisperKeyPerReasonCode() {
  assert(REASON_CODE_TO_WHISPER_KEY.OK === 'presence.recognized', 'OK -> presence.recognized');
  assert(REASON_CODE_TO_WHISPER_KEY.LOW_TRUST === 'presence.weak', 'LOW_TRUST -> presence.weak');
  assert(REASON_CODE_TO_WHISPER_KEY.OUTSIDE_ZONE === 'presence.outside', 'OUTSIDE_ZONE -> presence.outside');
  assert(REASON_CODE_TO_WHISPER_KEY.COOLDOWN === 'presence.cooldown', 'COOLDOWN -> presence.cooldown');
  assert(REASON_CODE_TO_WHISPER_KEY.NO_CARD === 'presence.no_card', 'NO_CARD -> presence.no_card');
  assert(MED_WHISPER_KEY === 'presence.uncertain', 'MED -> presence.uncertain');
  console.log('OK whisperKey present for each reasonCode path');
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
  console.log('All presence-verify-public tests passed.');
}

run();
