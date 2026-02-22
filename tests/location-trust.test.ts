/**
 * Unit tests for location-trust computeTrust.
 * Run: npx tsx tests/location-trust.test.ts
 */

import { computeTrust, type LocationSample } from '../src/lib/location-trust';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const now = Date.now();

// ----- Good cluster: 5 samples within ~10m, accuracy 5–15m, recent -----
function testGoodCluster() {
  const base = { lat: 48.886, lng: 2.343 };
  const samples: LocationSample[] = [
    { lat: base.lat + 0.00005, lng: base.lng, accuracy: 8, ts: now - 500 },
    { lat: base.lat - 0.00003, lng: base.lng + 0.00004, accuracy: 12, ts: now - 300 },
    { lat: base.lat, lng: base.lng, accuracy: 5, ts: now - 100 },
    { lat: base.lat + 0.00002, lng: base.lng - 0.00002, accuracy: 10, ts: now - 200 },
    { lat: base.lat - 0.00001, lng: base.lng + 0.00001, accuracy: 15, ts: now },
  ];
  const trust = computeTrust(samples);
  assert(trust.grade === 'HIGH' || trust.grade === 'MED', `Expected HIGH or MED, got ${trust.grade}`);
  assert(trust.best !== null, 'Expected best sample');
  assert(trust.samples.length === 5, `Expected 5 valid samples, got ${trust.samples.length}`);
  console.log('OK good cluster');
}

// ----- Noisy: scattered or high accuracy -----
function testNoisy() {
  const samples: LocationSample[] = [
    { lat: 48.88, lng: 2.34, accuracy: 80, ts: now },
    { lat: 48.89, lng: 2.35, accuracy: 90, ts: now - 100 },
    { lat: 48.87, lng: 2.33, accuracy: 70, ts: now - 200 },
  ];
  const trust = computeTrust(samples);
  assert(trust.grade === 'LOW', `Expected LOW for noisy, got ${trust.grade}`);
  console.log('OK noisy');
}

// ----- Stale: all > 10s old -----
function testStale() {
  const old = now - 15_000;
  const samples: LocationSample[] = [
    { lat: 48.886, lng: 2.343, accuracy: 5, ts: old },
    { lat: 48.886, lng: 2.343, accuracy: 8, ts: old - 1000 },
  ];
  const trust = computeTrust(samples);
  assert(trust.samples.length === 0, `Expected 0 valid (stale discarded), got ${trust.samples.length}`);
  assert(trust.grade === 'LOW', `Expected LOW, got ${trust.grade}`);
  assert(trust.best === null, 'Expected no best');
  console.log('OK stale');
}

// ----- Empty array -----
function testEmpty() {
  const trust = computeTrust([]);
  assert(trust.grade === 'LOW', `Expected LOW, got ${trust.grade}`);
  assert(trust.best === null, 'Expected no best');
  assert(trust.samples.length === 0, 'Expected no samples');
  assert(trust.reason.length > 0, 'Expected reason');
  console.log('OK empty');
}

// ----- MED boundary: 3 samples within 15m, accuracy ~30m -----
function testMedBoundary() {
  const base = { lat: 48.886, lng: 2.343 };
  const samples: LocationSample[] = [
    { lat: base.lat, lng: base.lng, accuracy: 35, ts: now },
    { lat: base.lat + 0.0001, lng: base.lng, accuracy: 40, ts: now - 500 },
    { lat: base.lat, lng: base.lng + 0.0001, accuracy: 38, ts: now - 300 },
  ];
  const trust = computeTrust(samples);
  assert(trust.grade === 'MED' || trust.grade === 'LOW', `Expected MED or LOW, got ${trust.grade}`);
  assert(trust.best !== null, 'Expected best sample');
  console.log('OK MED boundary');
}

testGoodCluster();
testNoisy();
testStale();
testEmpty();
testMedBoundary();
console.log('All location-trust tests passed.');
