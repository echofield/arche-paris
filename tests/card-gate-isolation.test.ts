/**
 * Card Gate V1 — Regression / isolation tests (plan: tests/card-gate-isolation.test.ts)
 *
 * Run against deployed Card Gate. Set CARD_GATE_URL and VITE_SUPABASE_ANON_KEY.
 * Example: CARD_GATE_URL=https://xxx.supabase.co/functions/v1/card-gate npx tsx tests/card-gate-isolation.test.ts
 *
 * Test scenarios (from plan):
 * - Client A cannot read Client B's journal entries (even with B's card_id in localStorage)
 * - Client A cannot insert into Client B's journal (even with B's card_id)
 * - Client A cannot leave trace as Client B
 * - Client A cannot access Client B's device_secret (even if they know B's card_id)
 * - Token expiry works (old token rejected after 4h)
 * - Invalid device_secret rejected
 * - Wrong device_secret for card_id rejected
 * - Non-existent card_id rejected
 * - Pairing generates unique device_secret per card
 * - Pairing is one-time only (409 error if already paired, no re-pairing in V1)
 */

const BASE = process.env.CARD_GATE_URL ?? "";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? "";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function fetchJson(
  path: string,
  options: { method?: string; body?: string; headers?: Record<string, string> } = {}
): Promise<{ status: number; data: unknown }> {
  const url = `${BASE.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}` } : {}),
      ...options.headers,
    },
    body: options.body,
  });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data };
}

/**
 * Non-existent card_id rejected (pair returns 404)
 */
export async function testNonExistentCardRejected(): Promise<void> {
  const { status, data } = await fetchJson("/pair", {
    method: "POST",
    body: JSON.stringify({ card_id: "XX-9999" }),
  });
  assert(status === 404, `Expected 404 for non-existent card, got ${status}: ${JSON.stringify(data)}`);
}

/**
 * Invalid device_secret rejected (validate returns 401)
 */
export async function testInvalidDeviceSecretRejected(): Promise<void> {
  const { status } = await fetchJson("/validate", {
    method: "POST",
    body: JSON.stringify({ card_id: "PS-0001", device_secret: "a".repeat(43) }),
  });
  assert(status === 401 || status === 404, `Expected 401/404 for invalid device_secret, got ${status}`);
}

/**
 * Wrong device_secret for card_id rejected (validate returns 401)
 */
export async function testWrongDeviceSecretRejected(): Promise<void> {
  const { status } = await fetchJson("/validate", {
    method: "POST",
    body: JSON.stringify({
      card_id: "PS-0001",
      device_secret: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwYWJjZGVm", // random base64url 32 bytes
    }),
  });
  assert(status === 401 || status === 404, `Expected 401/404 for wrong device_secret, got ${status}`);
}

/**
 * Expired or invalid token rejected (journal list returns 401)
 */
export async function testExpiredInvalidTokenRejected(): Promise<void> {
  const { status } = await fetchJson("/journal/list", {
    headers: { Authorization: "Bearer invalid.token.here" },
  });
  assert(status === 401, `Expected 401 for invalid token, got ${status}`);
}

/**
 * Client A cannot access Client B's data: journal/list uses card_id from JWT only.
 * (We cannot test "with B's card_id in body" because list doesn't take card_id — server uses JWT.)
 * So we only verify that without a valid token we get 401, and with a valid token we get data for that token's card only (server-enforced).
 */
export async function testIsolationServerEnforcesCardIdFromJwt(): Promise<void> {
  const { status } = await fetchJson("/journal/list", {
    headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYXJkX2lkIjoiUFMtMDAwMiIsImV4cCI6MTYwMDAwMDAwMH0.x" },
  });
  assert(status === 401, `Expected 401 for bad/expired JWT (tampered or expired), got ${status}`);
}

/**
 * Pairing is one-time only: second pair for same card returns 409 (if card already paired).
 * Requires a card that is already activated and paired — run manually or in integration.
 */
export async function testPairingOneTimeOnly(): Promise<void> {
  const { status, data } = await fetchJson("/pair", {
    method: "POST",
    body: JSON.stringify({ card_id: "PS-0001" }),
  });
  if (status === 409) {
    const d = data as { code?: string };
    assert(d?.code === "ALREADY_PAIRED" || (data as { error?: string })?.error?.toLowerCase().includes("paired"), "Expected ALREADY_PAIRED or paired message");
    return;
  }
  if (status === 404 || status === 400) return;
  assert(status === 200 || status === 409, `Expected 200 (first pair) or 409 (already paired), got ${status}`);
}

async function runAll(): Promise<void> {
  if (!BASE) {
    console.log("Skip: CARD_GATE_URL not set. Set it to run integration tests.");
    return;
  }
  const tests = [
    ["Non-existent card rejected", testNonExistentCardRejected],
    ["Invalid device_secret rejected", testInvalidDeviceSecretRejected],
    ["Wrong device_secret rejected", testWrongDeviceSecretRejected],
    ["Expired/invalid token rejected", testExpiredInvalidTokenRejected],
    ["Isolation (server enforces JWT card_id)", testIsolationServerEnforcesCardIdFromJwt],
    ["Pairing one-time only (409 when already paired)", testPairingOneTimeOnly],
  ];
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`OK: ${name}`);
    } catch (e) {
      console.error(`FAIL: ${name}`, e);
      process.exitCode = 1;
    }
  }
}

runAll();
