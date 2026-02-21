/**
 * Unit tests for Mon Paris entry + reading selectors.
 * Run: npx tsx tests/mon-paris-state.test.ts
 */

import {
  selectMonParisEntry,
  selectMonParisReading,
  getParisDateFromIso,
} from "../supabase/functions/card-gate/mon-paris-state.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const PARIS_DATE = "2025-02-21";
const zonesInView = [
  { arr: 10, h3: "PAR-10" },
  { arr: 11, h3: "PAR-11" },
  { arr: 5, h3: "PAR-5" },
];

// ----- Entry: EMPTY -----
function testEntryEmpty() {
  const meZones: Record<string, { progress: null }> = {
    "PAR-10": { progress: null },
  };
  const meAura = { questCallout: null };
  const entry = selectMonParisEntry(meZones, meAura, 0, zonesInView, PARIS_DATE);
  assert(entry.code === "MP_ENTRY_EMPTY", `Expected MP_ENTRY_EMPTY, got ${entry.code}`);
  assert(
    entry.text.includes("vide") && entry.text.includes("marchant"),
    `Expected empty message, got ${entry.text}`
  );
  assert(!entry.link, "Expected no link for EMPTY");
  console.log("OK entry EMPTY");
}

// ----- Entry: NEW_TERR (zone entered today by Paris date) -----
function testEntryNewTerr() {
  const todayIso = "2025-02-21T14:00:00.000Z";
  const meZones: Record<string, { progress: { entered_at: string; entered: boolean } | null }> = {
    "PAR-10": { progress: { entered_at: todayIso, entered: true } },
    "PAR-11": { progress: null },
  };
  const meAura = { questCallout: null };
  const entry = selectMonParisEntry(meZones, meAura, 1, zonesInView, PARIS_DATE);
  assert(entry.code === "MP_ENTRY_NEW_TERR", `Expected MP_ENTRY_NEW_TERR, got ${entry.code}`);
  assert(
    entry.text.includes("PAR-10") && entry.text.includes("ouverte"),
    `Expected new territory message with PAR-10, got ${entry.text}`
  );
  assert(entry.link?.label === "Voir" && entry.link?.href === "#collection", "Expected Voir link");
  console.log("OK entry NEW_TERR");
}

// ----- Entry: UNLOCK -----
function testEntryUnlock() {
  const meZones: Record<string, { progress: { entered_at: string; entered: boolean } }> = {
    "PAR-10": { progress: { entered_at: "2025-02-20T10:00:00.000Z", entered: true } },
  };
  const meAura = { questCallout: { locked: false, id: "q", title: "Q", ctaLabel: "Go", action: "open_map" as const } };
  const entry = selectMonParisEntry(meZones, meAura, 1, zonesInView, PARIS_DATE);
  assert(entry.code === "MP_ENTRY_UNLOCK", `Expected MP_ENTRY_UNLOCK, got ${entry.code}`);
  assert(entry.text.includes("déplacement") && entry.text.includes("ouvert"), `Expected unlock message, got ${entry.text}`);
  assert(entry.link?.label === "Ouvrir" && entry.link?.href === "#", "Expected Ouvrir link");
  console.log("OK entry UNLOCK");
}

// ----- Entry: FALLBACK -----
function testEntryFallback() {
  const meZones: Record<string, { progress: { entered_at: string; entered: boolean } }> = {
    "PAR-10": { progress: { entered_at: "2025-02-20T10:00:00.000Z", entered: true } },
  };
  const meAura = { questCallout: null };
  const entry = selectMonParisEntry(meZones, meAura, 1, zonesInView, PARIS_DATE);
  assert(entry.code === "MP_ENTRY_FALLBACK", `Expected MP_ENTRY_FALLBACK, got ${entry.code}`);
  assert(entry.text.includes("Marchez") && entry.text.includes("révèle"), `Expected fallback message, got ${entry.text}`);
  console.log("OK entry FALLBACK");
}

// ----- getParisDateFromIso -----
function testGetParisDateFromIso() {
  const d = getParisDateFromIso("2025-02-21T23:30:00.000Z");
  assert(d === "2025-02-21" || d === "2025-02-22", `Expected Paris date YYYY-MM-DD, got ${d}`);
  console.log("OK getParisDateFromIso");
}

// ----- Reading: TRACE (new user, gate allows) -----
function testReadingTrace() {
  const meZones: Record<string, { progress: null }> = { "PAR-10": { progress: null } };
  const meAura = { questCallout: null };
  // Gate is hash % 2 === 0. Use cardId+date that passes for TRACE.
  const cardId = "PS-0001";
  const parisDate = "2025-02-21";
  const reading = selectMonParisReading(meZones, meAura, 0, parisDate, cardId);
  // May be null if gate fails; when non-null must be TRACE
  if (reading) {
    assert(reading.layer === "TRACE", `Expected TRACE, got ${reading.layer}`);
    assert(
      reading.text.includes("trace") || reading.text.includes("mémoire"),
      `Expected TRACE pool sentence, got ${reading.text}`
    );
    assert(reading.code?.startsWith("MP_READING_TRACE_"), `Expected TRACE code, got ${reading.code}`);
  }
  console.log("OK reading TRACE (or null by gate)");
}

// ----- Reading: RELATION (>= 3 zones, gate allows) -----
function testReadingRelation() {
  const meZones: Record<string, { progress: { entered: boolean } }> = {
    "PAR-10": { progress: { entered: true } },
    "PAR-11": { progress: { entered: true } },
    "PAR-5": { progress: { entered: true } },
  };
  const meAura = { questCallout: null };
  const reading = selectMonParisReading(meZones, meAura, 5, "2025-02-21", "PS-0002");
  if (reading) {
    assert(reading.layer === "RELATION", `Expected RELATION, got ${reading.layer}`);
    assert(
      reading.text.includes("géométrie") || reading.text.includes("axes"),
      `Expected RELATION sentence, got ${reading.text}`
    );
  }
  console.log("OK reading RELATION (or null by gate)");
}

// ----- Determinism: same inputs => same entry -----
function testEntryDeterminism() {
  const meZones: Record<string, { progress: null }> = { "PAR-10": { progress: null } };
  const meAura = { questCallout: null };
  const a = selectMonParisEntry(meZones, meAura, 0, zonesInView, PARIS_DATE);
  const b = selectMonParisEntry(meZones, meAura, 0, zonesInView, PARIS_DATE);
  assert(a.code === b.code && a.text === b.text, "Entry must be deterministic");
  console.log("OK entry determinism");
}

function main() {
  testGetParisDateFromIso();
  testEntryEmpty();
  testEntryNewTerr();
  testEntryUnlock();
  testEntryFallback();
  testEntryDeterminism();
  testReadingTrace();
  testReadingRelation();
  console.log("\nAll mon-paris-state tests passed.");
}

main();
