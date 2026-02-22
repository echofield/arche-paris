/**
 * Meridian presence gating: grade decisions for soft vs seal.
 * Run: npx tsx tests/meridien-presence-gate.test.ts
 */

import {
  isGradeSufficientForSoftConfirmation,
  isGradeSufficientForSeal,
} from '../src/utils/meridien-presence-gate';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testSoftConfirmation() {
  assert(isGradeSufficientForSoftConfirmation('HIGH') === true, 'HIGH allows soft');
  assert(isGradeSufficientForSoftConfirmation('MED') === true, 'MED allows soft');
  assert(isGradeSufficientForSoftConfirmation('LOW') === false, 'LOW denies soft');
  assert(isGradeSufficientForSoftConfirmation(null) === false, 'null denies soft');
  console.log('OK soft confirmation gating');
}

function testSeal() {
  assert(isGradeSufficientForSeal('HIGH') === true, 'HIGH allows seal');
  assert(isGradeSufficientForSeal('MED') === false, 'MED denies seal');
  assert(isGradeSufficientForSeal('LOW') === false, 'LOW denies seal');
  assert(isGradeSufficientForSeal(null) === false, 'null denies seal');
  console.log('OK seal gating');
}

testSoftConfirmation();
testSeal();
console.log('All meridien-presence-gate tests passed.');
