/**
 * Unit tests for presence computeTrust (src/lib/presence).
 * Run: npx tsx tests/presence-compute-trust.test.ts
 */

import {
  computeTrust,
  haversineMeters,
  clamp01,
  type LocationSample,
} from '../src/lib/presence';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const now = Date.now();

// ----- clamp01 -----
function testClamp01() {
  assert(clamp01(0) === 0, 'clamp01(0)');
  assert(clamp01(1) === 1, 'clamp01(1)');
  assert(clamp01(0.5) === 0.5, 'clamp01(0.5)');
  assert(clamp01(-1) === 0, 'clamp01(-1)');
  assert(clamp01(2) === 1, 'clamp01(2)');
  console.log('OK clamp01');
}

// ----- haversineMeters -----
function testHaversine() {
  const d = haversineMeters(48.8566, 2.3522, 48.8576, 2.3532);
  assert(d > 100 && d < 200, `Expected ~130m, got ${d}`);
  assert(haversineMeters(0, 0, 0, 0) === 0, 'Same point');
  console.log('OK haversineMeters');
}

// ----- Stable cluster 8–15m accuracy => HIGH -----
function testStableClusterHigh() {
  const base = { lat: 48.886, lng: 2.343 };
  const samples: LocationSample[] = [
    { lat: base.lat + 0.00003, lng: base.lng, accuracy: 8, ts: now - 500 },
    { lat: base.lat - 0.00002, lng: base.lng + 0.00002, accuracy: 12, ts: now - 300 },
    { lat: base.lat, lng: base.lng, accuracy: 5, ts: now - 100 },
    { lat: base.lat + 0.00001, lng: base.lng - 0.00001, accuracy: 10, ts: now - 200 },
    { lat: base.lat - 0.00001, lng: base.lng + 0.00001, accuracy: 15, ts: now },
  ];
  const trust = computeTrust(samples);
  assert(trust.grade === 'HIGH', `Expected HIGH for stable 8–15m, got ${trust.grade}`);
  assert(trust.best !== null, 'Expected best sample');
  assert(trust.stable === true, 'Expected stable');
  assert(trust.score >= 0.75, `Expected score >= 0.75, got ${trust.score}`);
  console.log('OK stable cluster => HIGH');
}

// ----- 30–55m accuracy stable => MED (score >= 0.45, best <= 60) -----
function testStableMed() {
  const base = { lat: 48.886, lng: 2.343 };
  const samples: LocationSample[] = [
    { lat: base.lat, lng: base.lng, accuracy: 30, ts: now },
    { lat: base.lat + 0.00004, lng: base.lng, accuracy: 40, ts: now - 400 },
    { lat: base.lat, lng: base.lng + 0.00004, accuracy: 45, ts: now - 300 },
    { lat: base.lat - 0.00003, lng: base.lng, accuracy: 50, ts: now - 200 },
    { lat: base.lat, lng: base.lng - 0.00003, accuracy: 55, ts: now - 100 },
  ];
  const trust = computeTrust(samples);
  assert(trust.grade === 'MED', `Expected MED for stable 30–55m, got ${trust.grade}`);
  assert(trust.best !== null, 'Expected best sample');
  assert(trust.best.accuracy <= 60, `Expected best.accuracy <= 60, got ${trust.best.accuracy}`);
  console.log('OK stable 30–55m => MED');
}

// ----- Noisy 100m + teleport => LOW -----
function testNoisyLow() {
  const samples: LocationSample[] = [
    { lat: 48.88, lng: 2.34, accuracy: 100, ts: now },
    { lat: 48.89, lng: 2.35, accuracy: 120, ts: now - 500 },
    { lat: 48.87, lng: 2.33, accuracy: 90, ts: now - 1000 },
  ];
  const trust = computeTrust(samples);
  assert(trust.grade === 'LOW', `Expected LOW for noisy 100m, got ${trust.grade}`);
  assert(trust.best !== null, 'Expected best sample');
  console.log('OK noisy 100m => LOW');
}

// ----- Stability threshold: last 5 samples mean distance to center < 12m => stable -----
function testStabilityThreshold() {
  const base = { lat: 48.886, lng: 2.343 };
  const tight: LocationSample[] = [
    { lat: base.lat, lng: base.lng, accuracy: 10, ts: now },
    { lat: base.lat + 0.00002, lng: base.lng, accuracy: 10, ts: now - 100 },
    { lat: base.lat - 0.00002, lng: base.lng, accuracy: 10, ts: now - 200 },
    { lat: base.lat, lng: base.lng + 0.00002, accuracy: 10, ts: now - 300 },
    { lat: base.lat, lng: base.lng - 0.00002, accuracy: 10, ts: now - 400 },
  ];
  const trustTight = computeTrust(tight);
  assert(trustTight.stable === true, 'Tight cluster should be stable');

  const scattered: LocationSample[] = [
    { lat: base.lat + 0.0001, lng: base.lng + 0.0001, accuracy: 15, ts: now },
    { lat: base.lat - 0.0001, lng: base.lng - 0.0001, accuracy: 15, ts: now - 100 },
    { lat: base.lat + 0.00015, lng: base.lng, accuracy: 15, ts: now - 200 },
    { lat: base.lat - 0.00015, lng: base.lng, accuracy: 15, ts: now - 300 },
    { lat: base.lat, lng: base.lng + 0.00015, accuracy: 15, ts: now - 400 },
  ];
  const trustScattered = computeTrust(scattered);
  assert(trustScattered.stable === false, 'Scattered cluster should be unstable');
  console.log('OK stability threshold');
}

// ----- Stale samples discarded -----
function testStaleDiscarded() {
  const old = now - 15_000;
  const samples: LocationSample[] = [
    { lat: 48.886, lng: 2.343, accuracy: 5, ts: old },
    { lat: 48.886, lng: 2.343, accuracy: 8, ts: old - 1000 },
  ];
  const trust = computeTrust(samples);
  assert(trust.grade === 'LOW', `Expected LOW for stale, got ${trust.grade}`);
  assert(trust.best === null, 'Expected no best when all stale');
  console.log('OK stale discarded');
}

// ----- Empty -----
function testEmpty() {
  const trust = computeTrust([]);
  assert(trust.grade === 'LOW', `Expected LOW, got ${trust.grade}`);
  assert(trust.best === null, 'Expected no best');
  assert(trust.reason.length > 0, 'Expected reason');
  console.log('OK empty');
}

// ----- Anchor bonus does not turn LOW into HIGH -----
function testAnchorNeverLowToHigh() {
  const base = { lat: 48.886, lng: 2.343 };
  const badSamples: LocationSample[] = [
    { lat: base.lat, lng: base.lng, accuracy: 90, ts: now },
    { lat: base.lat + 0.0001, lng: base.lng, accuracy: 85, ts: now - 500 },
  ];
  const anchor = { lat: base.lat, lng: base.lng, ts: now - 1000, grade: 'HIGH' as const };
  const trustNoAnchor = computeTrust(badSamples);
  const trustWithAnchor = computeTrust(badSamples, anchor);
  assert(trustNoAnchor.grade === 'LOW', 'Bad samples without anchor => LOW');
  assert(trustWithAnchor.grade === 'LOW', 'Anchor must not upgrade bad samples to HIGH or MED');
  console.log('OK anchor never LOW->HIGH');
}

function run() {
  testClamp01();
  testHaversine();
  testStableClusterHigh();
  testStableMed();
  testNoisyLow();
  testStabilityThreshold();
  testStaleDiscarded();
  testEmpty();
  testAnchorNeverLowToHigh();
  console.log('All presence computeTrust tests passed.');
}

run();
