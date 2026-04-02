/**
 * ARCHÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â° ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â Card Gate Edge Function (V1)
 *
 * INVARIANTS (documented):
 * 1) Activation requires non-enumerable proof (code+password via activate-card).
 *    activate_card must never succeed with card_id alone. Pairing assumes this.
 * 2) /pair allowed only if activated_at IS NOT NULL AND device_secret_hash IS NULL.
 *    One-time only; return 409 Already paired if already paired.
 * 3) Device identity: device_secret only (32 bytes), hash in DB. Fingerprint UX only.
 * 4) All sensitive ops (journal, traces) go through this gate with service_role.
 * 5) Rate limiting: DB-backed on /pair, /validate, /journal/*, /trace/*.
 * 6) JWT scoped per cardId, 4h, refresh via /validate.
 * 7) No fallback: if Card Gate fails, client queues locally / shows offline.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { Hono } from "npm:hono@4.6.14";
import { SignJWT, jwtVerify } from "npm:jose@5.9.6";
import { selectMonParisEntry, selectMonParisReading } from "./mon-paris-state.ts";
import { computeTrust, haversineMeters } from "./presence-trust.ts";
import { getPresenceZone, presenceAllowZoneFromBody } from "./presence-zones.ts";

// Request path is full URL pathname e.g. /functions/v1/card-gate/champs/active (proxy sends full URL)
const CARD_GATE_BASE_PATH = "/functions/v1/card-gate";
const app = new Hono().basePath(CARD_GATE_BASE_PATH);
const JSON_UTF8 = "application/json; charset=utf-8";

// Allowed origins only (no random site can use visitor's browser as relay).
// Browsers send punycode in Origin (e.g. www.xn--arch-paris-e7a.com for www.archÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©-paris.com).
const ALLOWED_ORIGINS = [
  "https://arche-paris.com",
  "https://www.arche-paris.com",
  "https://xn--arch-paris-e7a.com",
  "https://www.xn--arch-paris-e7a.com",
];

function normalizeCardGateRequestPath(req: Request): Request {
  const url = new URL(req.url);

  // Some gateways forward /functions/v1/card-gate/card-gate/...; collapse duplicate slug.
  const duplicatedBase = `${CARD_GATE_BASE_PATH}/card-gate`;
  if (url.pathname === duplicatedBase || url.pathname.startsWith(`${duplicatedBase}/`)) {
    const tail = url.pathname.slice(duplicatedBase.length);
    const normalizedTail = tail.length > 0 ? (tail.startsWith("/") ? tail : `/${tail}`) : "";
    url.pathname = `${CARD_GATE_BASE_PATH}${normalizedTail}`;
    return new Request(url.toString(), req);
  }

  if (url.pathname.startsWith(CARD_GATE_BASE_PATH)) return req;

  let incomingPath = url.pathname;
  if (incomingPath === "/card-gate") {
    incomingPath = "/";
  } else if (incomingPath.startsWith("/card-gate/")) {
    incomingPath = incomingPath.slice("/card-gate".length);
  }

  const suffix = incomingPath.startsWith("/") ? incomingPath : `/${incomingPath}`;
  url.pathname = `${CARD_GATE_BASE_PATH}${suffix}`.replace(/\/{2,}/g, "/");
  return new Request(url.toString(), req);
}
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin === "http://localhost:5173" || origin === "http://localhost:3000" || origin.startsWith("http://127.0.0.1:")) return true;
  if (origin.endsWith(".vercel.app") && (origin.startsWith("https://") || origin.startsWith("http://"))) return true;
  if (origin.endsWith(".netlify.app") && (origin.startsWith("https://") || origin.startsWith("http://"))) return true;
  return false;
}

/** Set CORS headers: always echo allowed origin (never '*') so credentials: 'include' works. */
function setCorsHeaders(headers: Headers, origin: string | undefined): void {
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, apikey, X-ARCHE-CARD-CODE, X-ARCHE-SESSION");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "600");

  if (origin && isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  // If origin not allowed, do NOT set Access-Control-Allow-Origin (not even '*')
}

/** Get CORS headers as object (for compatibility with existing code) */
function getCorsHeaders(c: { req: { header: (n: string) => string | undefined } }): Record<string, string> {
  const origin = c.req.header("Origin");
  const headers = new Headers();
  setCorsHeaders(headers, origin);
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// Logging middleware only (no CORS manipulation)
app.use("*", async (c, next) => {
  console.log("[card-gate]", c.req.method, c.req.path, "Origin:", c.req.header("Origin") ?? "(none)");
  await next();
});

// Origin validation middleware (returns error response if needed)
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");
  if (origin && !isOriginAllowed(origin)) {
    console.log("[card-gate] Origin not allowed:", origin);
    const errorHeaders = new Headers();
    errorHeaders.set("Content-Type", JSON_UTF8);
    setCorsHeaders(errorHeaders, origin); // Set CORS for error response too
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: errorHeaders,
    });
  }
  await next();
});

// Enforce UTF-8 JSON responses for all card-gate payloads.
app.use("*", async (c, next) => {
  await next();
  const contentType = c.res.headers.get("Content-Type");
  if (!contentType) return;
  if (!contentType.toLowerCase().includes("application/json")) return;
  if (contentType.toLowerCase().includes("charset=")) return;
  c.res.headers.set("Content-Type", JSON_UTF8);
});

const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const MAP_READ_CACHE_TTL_MS = 60_000;
const MAP_CACHE_CONTROL_PUBLIC = "public, s-maxage=60, stale-while-revalidate=600";
const MAP_CACHE_CONTROL_PRIVATE = "private, no-store";

type ReadCacheEntry = {
  expiresAt: number;
  body: unknown;
};

const mapReadCache = new Map<string, ReadCacheEntry>();

function readMapCache<T>(key: string): T | null {
  const hit = mapReadCache.get(key);
  if (!hit) return null;
  if (Date.now() >= hit.expiresAt) {
    mapReadCache.delete(key);
    return null;
  }
  return hit.body as T;
}

function writeMapCache(key: string, body: unknown, ttlMs = MAP_READ_CACHE_TTL_MS): void {
  mapReadCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    body,
  });
}

function normalizeLegacyText(input: string): string {
  let text = (input ?? "").replace(/\s+/g, " ").trim();
  if (!text) return text;

  // Attempt to recover strings that were UTF-8 bytes misread as Latin-1.
  if (/[ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢]/.test(text)) {
    try {
      const bytes = Uint8Array.from(Array.from(text, (ch) => ch.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder("utf-8").decode(bytes);
      if (decoded && !decoded.includes("\u0000")) {
        text = decoded;
      }
    } catch {
      // Keep original text if decoding fails.
    }
  }

  // Common mojibake fragments observed in legacy traces.
  text = text
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦/g, "...")
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â|ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“/g, "-")
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢/g, "'")
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â/g, "\"")
    .replace(/ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·/g, "ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·")
    .replace(/ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â«/g, "ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â«")
    .replace(/ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»/g, "ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»");

  // Heuristic repair for replacement-char corruption inside French words.
  text = text
    .replace(/([A-Za-z])\uFFFD([A-Za-z])/g, "$1e$2")
    .replace(/pr\uFFFDsence/gi, "prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sence")
    .replace(/t\uFFFDmoin/gi, "tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©moin")
    .replace(/deuxi\uFFFDme/gi, "deuxiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me")
    .replace(/premi\uFFFDres/gi, "premiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨res")
    .replace(/\uFFFD/g, "e");

  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}

// Cookie settings for refresh token
function getRefreshCookieOptions(origin: string | undefined): string {
  const isLocalhost = origin?.includes("localhost") || origin?.includes("127.0.0.1");
  const secure = !isLocalhost;
  const sameSite = "Lax";
  const maxAge = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  return `HttpOnly; ${secure ? "Secure; " : ""}SameSite=${sameSite}; Max-Age=${maxAge}; Path=/`;
}

function clearRefreshCookie(origin: string | undefined): string {
  const isLocalhost = origin?.includes("localhost") || origin?.includes("127.0.0.1");
  const secure = !isLocalhost;
  return `HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Max-Age=0; Path=/`;
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function dbRateLimit(
  supabase: ReturnType<typeof createClient>,
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[card-gate] rate limit RPC error:", error);
    return false;
  }
  return data === true;
}

function getClientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function signAccessToken(cardId: string): Promise<string> {
  const secret = Deno.env.get("CARD_GATE_JWT_SECRET");
  if (!secret) throw new Error("CARD_GATE_JWT_SECRET not set");
  const key = new TextEncoder().encode(secret);
  const exp = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000);
  return await new SignJWT({ card_id: cardId, type: "access" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(key);
}

// Parse refresh cookie: "card_id:device_secret_b64"
function parseRefreshCookie(cookieHeader: string | undefined): { cardId: string; deviceSecret: string } | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const refreshCookie = cookies.find((c) => c.startsWith("arche_refresh="));
  if (!refreshCookie) return null;
  const value = refreshCookie.split("=")[1];
  if (!value) return null;
  const decoded = decodeURIComponent(value);
  const sepIndex = decoded.indexOf(":");
  if (sepIndex === -1) return null;
  const cardId = decoded.slice(0, sepIndex);
  const deviceSecret = decoded.slice(sepIndex + 1);
  if (!cardId || !deviceSecret) return null;
  return { cardId, deviceSecret };
}

async function verifyToken(token: string): Promise<{ card_id: string } | null> {
  const secret = Deno.env.get("CARD_GATE_JWT_SECRET");
  if (!secret) return null;
  const key = new TextEncoder().encode(secret);
  try {
    const { payload } = await jwtVerify(token, key);
    const cardId = payload.card_id as string;
    return cardId ? { card_id: cardId } : null;
  } catch {
    return null;
  }
}

async function resolveCardSession(c: { req: { header: (n: string) => string | undefined } }): Promise<{ card_id: string; actor_hash: string } | null> {
  const cardCode = (c.req.header("X-ARCHE-CARD-CODE") ?? c.req.header("X-ARCHE-SESSION") ?? "").trim();
  if (!cardCode || cardCode.length > 128) return null;
  const refresh = parseRefreshCookie(c.req.header("Cookie"));
  if (!refresh || refresh.cardId !== cardCode) return null;
  let secretHash = "";
  try {
    const secretBytes = b64urlDecode(refresh.deviceSecret);
    secretHash = await sha256Hex(secretBytes);
  } catch {
    return null;
  }
  const supabase = getSupabase();
  const { data: card, error } = await supabase
    .from("cards")
    .select("id, activated_at, device_secret_hash")
    .eq("id", cardCode)
    .maybeSingle();
  if (error || !card?.id || card.activated_at == null || !card.device_secret_hash) return null;
  if (!constantTimeCompare(card.device_secret_hash, secretHash)) return null;
  const actorHash = await sha256Hex(new TextEncoder().encode(card.id));
  return { card_id: card.id, actor_hash: actorHash.slice(0, 32) };
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Password verification (same algorithm as make-server)
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  const saltHex = parts[0];
  const expectedHash = parts[1];
  if (!saltHex || !expectedHash) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === expectedHash;
}

// ----- /pair -----
app.post("/pair", async (c) => {
  const supabase = getSupabase();
  let body: { card_id?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const cardId = body?.card_id;
  if (!cardId || typeof cardId !== "string") {
    return c.json({ error: "card_id required" }, 400);
  }

  const rateKey = `pair:${cardId}`;
  const allowed = await dbRateLimit(supabase, rateKey, 15, 3600);
  if (!allowed) {
    return c.json({ error: "Too many pairing attempts. Try again later." }, 429);
  }

  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("id, activated_at, device_secret_hash")
    .eq("id", cardId)
    .single();

  if (fetchError || !card) {
    return c.json({ error: "Card not found" }, 404);
  }

  if (card.activated_at == null) {
    return c.json({ error: "Card not activated. Activate with code and password first." }, 400);
  }

  if (card.device_secret_hash != null) {
    return c.json({
      error: "Already paired",
      code: "ALREADY_PAIRED",
      hint: "Use POST /device/force-unpair with card_id + card_code",
    }, 409);
  }

  const deviceSecret = crypto.getRandomValues(new Uint8Array(32));
  const hashHex = await sha256Hex(deviceSecret);
  const { error: updateError } = await supabase
    .from("cards")
    .update({ device_secret_hash: hashHex })
    .eq("id", cardId);

  if (updateError) {
    console.error("[card-gate] pair update error:", updateError);
    return c.json({ error: "Pairing failed" }, 500);
  }

  // Set refresh cookie (httpOnly) and return access token
  const deviceSecretB64 = b64urlEncode(deviceSecret);
  const origin = c.req.header("Origin");
  const cookieValue = encodeURIComponent(`${cardId}:${deviceSecretB64}`);
  const accessToken = await signAccessToken(cardId);
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

  return new Response(JSON.stringify({
    ok: true,
    access_token: accessToken,
    expires_at: expiresAt
  }), {
    status: 200,
    headers: {
      ...getCorsHeaders(c),
      "Content-Type": JSON_UTF8,
      "Set-Cookie": `arche_refresh=${cookieValue}; ${getRefreshCookieOptions(origin)}`,
    },
  });
});

// ----- /validate -----
app.post("/validate", async (c) => {
  const supabase = getSupabase();
  const ip = getClientIp(c);
  let body: { card_id?: string; device_secret?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const cardId = body?.card_id;
  const deviceSecretB64 = body?.device_secret;
  if (!cardId || !deviceSecretB64 || typeof cardId !== "string" || typeof deviceSecretB64 !== "string") {
    return c.json({ error: "card_id and device_secret required" }, 400);
  }

  const rateKeyCard = `validate:${cardId}`;
  const rateKeyIp = `validate_ip:${ip}`;
  if (!(await dbRateLimit(supabase, rateKeyCard, 10, 3600))) {
    return c.json({ error: "Too many validation attempts for this card." }, 429);
  }
  if (!(await dbRateLimit(supabase, rateKeyIp, 50, 3600))) {
    return c.json({ error: "Too many requests from this device." }, 429);
  }

  let deviceSecret: Uint8Array;
  try {
    deviceSecret = b64urlDecode(deviceSecretB64);
  } catch {
    return c.json({ error: "Invalid device_secret" }, 400);
  }
  if (deviceSecret.length !== 32) {
    return c.json({ error: "Invalid device_secret" }, 400);
  }

  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("id, device_secret_hash")
    .eq("id", cardId)
    .single();

  if (fetchError || !card?.device_secret_hash) {
    return c.json({ error: "Invalid card or not paired" }, 401);
  }

  const providedHash = await sha256Hex(deviceSecret);
  if (!constantTimeCompare(providedHash, card.device_secret_hash)) {
    return c.json({ error: "Invalid device_secret" }, 401);
  }

  // Set refresh cookie and return access token
  const origin = c.req.header("Origin");
  const cookieValue = encodeURIComponent(`${cardId}:${deviceSecretB64}`);
  const accessToken = await signAccessToken(cardId);
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

  return new Response(JSON.stringify({
    ok: true,
    access_token: accessToken,
    expires_at: expiresAt
  }), {
    status: 200,
    headers: {
      ...getCorsHeaders(c),
      "Content-Type": JSON_UTF8,
      "Set-Cookie": `arche_refresh=${cookieValue}; ${getRefreshCookieOptions(origin)}`,
    },
  });
});

// ----- /refresh -----
// Reads refresh token from httpOnly cookie, validates, returns new access token
app.post("/refresh", async (c) => {
  const supabase = getSupabase();
  const ip = getClientIp(c);

  // Parse refresh cookie
  const cookieHeader = c.req.header("Cookie");
  const parsed = parseRefreshCookie(cookieHeader);
  if (!parsed) {
    return c.json({ error: "No valid refresh token" }, 401);
  }

  const { cardId, deviceSecret: deviceSecretB64 } = parsed;

  // Rate limiting
  const rateKeyCard = `refresh:${cardId}`;
  const rateKeyIp = `refresh_ip:${ip}`;
  if (!(await dbRateLimit(supabase, rateKeyCard, 60, 3600))) {
    return c.json({ error: "Too many refresh attempts for this card." }, 429);
  }
  if (!(await dbRateLimit(supabase, rateKeyIp, 200, 3600))) {
    return c.json({ error: "Too many requests from this device." }, 429);
  }

  // Validate device secret
  let deviceSecret: Uint8Array;
  try {
    deviceSecret = b64urlDecode(deviceSecretB64);
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }
  if (deviceSecret.length !== 32) {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("id, device_secret_hash")
    .eq("id", cardId)
    .single();

  if (fetchError || !card?.device_secret_hash) {
    return c.json({ error: "Invalid card or not paired" }, 401);
  }

  const providedHash = await sha256Hex(deviceSecret);
  if (!constantTimeCompare(providedHash, card.device_secret_hash)) {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  // Return new access token
  const accessToken = await signAccessToken(cardId);
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

  return c.json({
    access_token: accessToken,
    expires_at: expiresAt,
    card_id: cardId
  });
});

// ----- /unpair-session -----
// Cookie-only unpair: verify refresh cookie -> clear device_secret_hash -> clear cookie.
// If no cookie but card_id provided in body, check if card is still paired and return specific error.
app.post("/unpair-session", async (c) => {
  const supabase = getSupabase();
  const ip = getClientIp(c);

  const cookieHeader = c.req.header("Cookie");
  const parsed = parseRefreshCookie(cookieHeader);

  // Try to get card_id from body (for checking if card is still paired)
  let bodyCardId: string | null = null;
  try {
    const body = await c.req.json();
    bodyCardId = body?.card_id ?? null;
  } catch {
    // No body or invalid JSON - that's fine
  }

  if (!parsed) {
    const origin = c.req.header("Origin");

    // If card_id provided, check if card is still paired on server
    if (bodyCardId) {
      const { data: card } = await supabase
        .from("cards")
        .select("device_secret_hash")
        .eq("id", bodyCardId)
        .single();

      if (card?.device_secret_hash) {
        // Card is still paired but we have no cookie to verify identity
        // User needs to use force-unpair with password
        console.log(`[card-gate] unpair-session: no cookie but card ${bodyCardId} is still paired`);
        return new Response(JSON.stringify({
          ok: false,
          code: "COOKIE_MISSING_CARD_PAIRED",
          message: "Session expirÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e. Utilisez votre mot de passe pour dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©connecter."
        }), {
          status: 401,
          headers: {
            ...getCorsHeaders(c),
            "Content-Type": JSON_UTF8,
            "Set-Cookie": `arche_refresh=; ${clearRefreshCookie(origin)}`,
          },
        });
      }
    }

    // No cookie and card not paired (or no card_id) - just clear local state
    return new Response(JSON.stringify({ ok: true, message: "No session" }), {
      status: 200,
      headers: {
        ...getCorsHeaders(c),
        "Content-Type": JSON_UTF8,
        "Set-Cookie": `arche_refresh=; ${clearRefreshCookie(origin)}`,
      },
    });
  }

  const { cardId, deviceSecret: deviceSecretB64 } = parsed;

  const rateKeyCard = `unpair_session:${cardId}`;
  const rateKeyIp = `unpair_session_ip:${ip}`;
  if (!(await dbRateLimit(supabase, rateKeyCard, 10, 3600))) {
    return c.json({ error: "Too many unpair attempts for this card." }, 429);
  }
  if (!(await dbRateLimit(supabase, rateKeyIp, 30, 3600))) {
    return c.json({ error: "Too many requests from this device." }, 429);
  }

  let deviceSecret: Uint8Array;
  try {
    deviceSecret = b64urlDecode(deviceSecretB64);
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }
  if (deviceSecret.length !== 32) {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("id, device_secret_hash")
    .eq("id", cardId)
    .single();

  if (fetchError || !card?.device_secret_hash) {
    const origin = c.req.header("Origin");
    return new Response(JSON.stringify({ ok: true, message: "Not paired" }), {
      status: 200,
      headers: {
        ...getCorsHeaders(c),
        "Content-Type": JSON_UTF8,
        "Set-Cookie": `arche_refresh=; ${clearRefreshCookie(origin)}`,
      },
    });
  }

  const providedHash = await sha256Hex(deviceSecret);
  if (!constantTimeCompare(providedHash, card.device_secret_hash)) {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  const { error: updateError } = await supabase
    .from("cards")
    .update({ device_secret_hash: null })
    .eq("id", cardId);

  if (updateError) {
    console.error("[card-gate] unpair-session update error:", updateError);
    return c.json({ error: "Unpair failed" }, 500);
  }

  await supabase.from("rate_limits").delete().eq("key", `pair:${cardId}`);

  const origin = c.req.header("Origin");
  return new Response(JSON.stringify({ ok: true, message: "Device unpaired successfully" }), {
    status: 200,
    headers: {
      ...getCorsHeaders(c),
      "Content-Type": JSON_UTF8,
      "Set-Cookie": `arche_refresh=; ${clearRefreshCookie(origin)}`,
    },
  });
});

// ----- /unpair -----
// Allows device to unpair using device_secret (no JWT needed, as JWT may be expired)
app.post("/unpair", async (c) => {
  const supabase = getSupabase();
  const ip = getClientIp(c);
  let body: { card_id?: string; device_secret?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const cardId = body?.card_id;
  const deviceSecretB64 = body?.device_secret;
  if (!cardId || !deviceSecretB64 || typeof cardId !== "string" || typeof deviceSecretB64 !== "string") {
    return c.json({ error: "card_id and device_secret required" }, 400);
  }

  // Rate limit unpair attempts
  const rateKeyCard = `unpair:${cardId}`;
  const rateKeyIp = `unpair_ip:${ip}`;
  if (!(await dbRateLimit(supabase, rateKeyCard, 5, 3600))) {
    return c.json({ error: "Too many unpair attempts for this card." }, 429);
  }
  if (!(await dbRateLimit(supabase, rateKeyIp, 20, 3600))) {
    return c.json({ error: "Too many requests from this device." }, 429);
  }

  let deviceSecret: Uint8Array;
  try {
    deviceSecret = b64urlDecode(deviceSecretB64);
  } catch {
    return c.json({ error: "Invalid device_secret" }, 400);
  }
  if (deviceSecret.length !== 32) {
    return c.json({ error: "Invalid device_secret" }, 400);
  }

  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("id, device_secret_hash")
    .eq("id", cardId)
    .single();

  if (fetchError || !card?.device_secret_hash) {
    return c.json({ error: "Invalid card or not paired" }, 401);
  }

  const providedHash = await sha256Hex(deviceSecret);
  if (!constantTimeCompare(providedHash, card.device_secret_hash)) {
    return c.json({ error: "Invalid device_secret" }, 401);
  }

  // Clear the device_secret_hash to unpair
  const { error: updateError } = await supabase
    .from("cards")
    .update({ device_secret_hash: null })
    .eq("id", cardId);

  if (updateError) {
    console.error("[card-gate] unpair update error:", updateError);
    return c.json({ error: "Unpair failed" }, 500);
  }

  // Also clear any rate limit for pairing so user can re-pair immediately
  await supabase.from("rate_limits").delete().eq("key", `pair:${cardId}`);

  // Clear the refresh cookie
  const origin = c.req.header("Origin");
  return new Response(JSON.stringify({ ok: true, message: "Device unpaired successfully" }), {
    status: 200,
    headers: {
      ...getCorsHeaders(c),
      "Content-Type": JSON_UTF8,
      "Set-Cookie": `arche_refresh=; ${clearRefreshCookie(origin)}`,
    },
  });
});

// ----- /force-unpair -----
// For when user has no local device_secret (e.g., cleared browser data)
// Authenticates via password instead of device_secret
app.post("/force-unpair", async (c) => {
  const supabase = getSupabase();
  const ip = getClientIp(c);
  let body: { card_id?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const cardId = body?.card_id;
  const password = body?.password;
  if (!cardId || !password || typeof cardId !== "string" || typeof password !== "string") {
    return c.json({ error: "card_id and password required" }, 400);
  }

  // Rate limit force-unpair (allow retries for wrong password / transfer flow)
  const rateKeyCard = `force_unpair:${cardId}`;
  const rateKeyIp = `force_unpair_ip:${ip}`;
  if (!(await dbRateLimit(supabase, rateKeyCard, 10, 3600))) {
    console.log(`[card-gate] force-unpair rate limited for card: ${cardId}`);
    return c.json({ error: "Too many force-unpair attempts for this card." }, 429);
  }
  if (!(await dbRateLimit(supabase, rateKeyIp, 30, 3600))) {
    console.log(`[card-gate] force-unpair rate limited for IP: ${ip}`);
    return c.json({ error: "Too many requests from this device." }, 429);
  }

  // Fetch card with password_hash
  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("id, password_hash, device_secret_hash")
    .eq("id", cardId)
    .single();

  if (fetchError || !card) {
    console.log(`[card-gate] force-unpair card not found: ${cardId}`);
    return c.json({ error: "Card not found" }, 404);
  }

  if (!card.password_hash) {
    console.log(`[card-gate] force-unpair card not activated: ${cardId}`);
    return c.json({ error: "Card not activated" }, 400);
  }

  // Verify password
  const isValid = await verifyPassword(password, card.password_hash);
  if (!isValid) {
    console.log(`[card-gate] force-unpair invalid password for card: ${cardId}`);
    return c.json({ error: "Invalid password" }, 401);
  }

  // Clear the device_secret_hash
  const { error: updateError } = await supabase
    .from("cards")
    .update({ device_secret_hash: null })
    .eq("id", cardId);

  if (updateError) {
    console.error("[card-gate] force-unpair update error:", updateError);
    return c.json({ error: "Force unpair failed" }, 500);
  }

  // Clear rate limits for pairing so user can re-pair immediately
  await supabase.from("rate_limits").delete().eq("key", `pair:${cardId}`);

  // Clear the refresh cookie
  const origin = c.req.header("Origin");
  console.log(`[card-gate] force-unpair successful for card: ${cardId}`);
  return new Response(JSON.stringify({ ok: true, message: "Device force-unpaired successfully" }), {
    status: 200,
    headers: {
      ...getCorsHeaders(c),
      "Content-Type": JSON_UTF8,
      "Set-Cookie": `arche_refresh=; ${clearRefreshCookie(origin)}`,
    },
  });
});

// ----- Helper: require JWT -----
async function requireJwt(c: { req: { header: (n: string) => string | undefined } }): Promise<{ card_id: string; actor_hash?: string } | Response> {
  const auth = c.req.header("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const cors = getCorsHeaders(c);
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const actorHash = await sha256Hex(new TextEncoder().encode(payload.card_id));
      return { ...payload, actor_hash: actorHash.slice(0, 32) };
    }
  }
  const sessionPayload = await resolveCardSession(c);
  if (sessionPayload) return sessionPayload;
  return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401, headers: { ...cors, "Content-Type": JSON_UTF8 } });
}

async function requireOptionalJwt(c: { req: { header: (n: string) => string | undefined } }): Promise<{ card_id: string; actor_hash?: string } | null> {
  const auth = c.req.header("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const actorHash = await sha256Hex(new TextEncoder().encode(payload.card_id));
      return { ...payload, actor_hash: actorHash.slice(0, 32) };
    }
  }
  return await resolveCardSession(c);
}

async function rateLimitJournal(
  supabase: ReturnType<typeof createClient>,
  cardId: string,
  ip: string
): Promise<boolean> {
  const k1 = `journal:${cardId}`;
  const k2 = `journal_ip:${ip}`;
  return (await dbRateLimit(supabase, k1, 100, 3600)) && (await dbRateLimit(supabase, k2, 500, 3600));
}

async function rateLimitTrace(
  supabase: ReturnType<typeof createClient>,
  cardId: string,
  ip: string
): Promise<boolean> {
  const k1 = `trace:${cardId}`;
  const k2 = `trace_ip:${ip}`;
  return (await dbRateLimit(supabase, k1, 60, 3600)) && (await dbRateLimit(supabase, k2, 200, 3600));
}

async function rateLimitMap(
  supabase: ReturnType<typeof createClient>,
  cardId: string,
  ip: string
): Promise<boolean> {
  const k1 = `map:${cardId}`;
  const k2 = `map_ip:${ip}`;
  return (await dbRateLimit(supabase, k1, 100, 3600)) && (await dbRateLimit(supabase, k2, 300, 3600));
}

async function rateLimitMapPublic(
  supabase: ReturnType<typeof createClient>,
  ip: string
): Promise<boolean> {
  const k = `map_public_ip:${ip}`;
  return await dbRateLimit(supabase, k, 300, 3600);
}

type LawRequirement = {
  type: string;
  status?: "ok" | "missing" | "blocked";
  min?: number;
  within_minutes?: number;
  count?: number;
};

type AnchorType = "alignment" | "threshold" | "absence" | "measurement" | "revelation";

type AnchorConstraint = {
  temporal?: {
    mode: "solar_noon" | "daily_window";
    window_minutes?: number;
    start_hour?: number;
    end_hour?: number;
  };
  spatial?: {
    mode: "linearity" | "dwell";
    min_displacement_m?: number;
    radius_m?: number;
  };
  presence?: {
    min_pulses_20m?: number;
  };
};

type MeridianAnchor = {
  id: string;
  h3: string;
  label: string;
  type: AnchorType;
  location_hint: string;
  constraints?: AnchorConstraint;
};

type CharacterFragmentKind = "hint" | "witness" | "echo" | "threshold" | "warning";

type ResolvedCharacter = {
  id: string;
  name: string;
  lines: string[];
  echo?: {
    location_hint: string;
    symbol: string;
  };
};

const LAW_VERSION = "2026-02-19.1";
const WORLD_VERSION = "2026-02-19.1";
const PROTECTED_INTENTS = new Set(["ritual.start"]);
const PRESENCE_PULSE_COOLDOWN_MS = 30_000;
const PRESENCE_PULSE_WINDOW_MINUTES = 20;
const PRESENCE_PULSE_MIN_FOR_RITUAL = 3;
const WHISPER_MIN_PRESENCE = 6;
const WHISPER_ROTATION_MINUTES = 15;
const WHISPER_COOLDOWN_MINUTES = 10;
const CHARACTER_COOLDOWN_HOURS = 3;

const DEFAULT_WHISPERS = [
  "Measure is a kind of power.",
  "Find the line that was never drawn.",
  "Someone measured the world from here.",
];

const ZONE_WHISPERS: Record<string, string[]> = {
  "PAR-01": [
    "Measure is a kind of power.",
    "Find the line that was never drawn.",
    "Stand still for 20 seconds.",
  ],
  "PAR-05": [
    "Books remember what footsteps forget.",
    "Knowledge also leaves a trace.",
    "The question arrives before the answer.",
  ],
  "PAR-10": [
    "Crossing is a form of memory.",
    "Listen for the line beneath the noise.",
    "The city moves before you do.",
  ],
};

const WHISPERS_BY_ANCHOR_TYPE: Record<AnchorType, string[]> = {
  alignment: [
    "The axis exists before intention.",
    "Alignment is remembered in silence.",
  ],
  threshold: [
    "A boundary can be measured without being crossed.",
    "The line changes meaning at its edge.",
  ],
  absence: [
    "What is missing also coordinates the city.",
    "Absence can hold a direction.",
  ],
  measurement: [
    "Measure is a kind of power.",
    "Precision is a form of attention.",
  ],
  revelation: [
    "Light discloses what clocks conceal.",
    "A structure appears when you wait.",
  ],
};

const LOW_PRESENCE_WHISPERS_BY_ANCHOR_TYPE: Record<AnchorType, string[]> = {
  alignment: [
    "The line waits for one more step.",
    "Alignment begins before certainty.",
  ],
  threshold: [
    "A boundary is near, but still quiet.",
    "The edge is present, not yet crossed.",
  ],
  absence: [
    "The missing point is still speaking softly.",
    "Absence is here, but not yet shared.",
  ],
  measurement: [
    "A measure is forming, almost audible.",
    "The instrument is awake, waiting for insistence.",
  ],
  revelation: [
    "A structure almost appears, then folds back.",
    "Light is gathering but not yet declaring.",
  ],
};

const CHAMP_SEED_BY_ANCHOR_TYPE: Record<AnchorType, string[]> = {
  alignment: [
    "A line of attention crosses this district.",
    "The axis here remembers older footsteps.",
  ],
  threshold: [
    "A threshold holds the air in this zone.",
    "Something shifts at the edge of this place.",
  ],
  absence: [
    "An absent marker still orients the walk.",
    "A missing point gives direction here.",
  ],
  measurement: [
    "Measure returns where the city was once calibrated.",
    "Precision leaves a discreet trace in this zone.",
  ],
  revelation: [
    "Light reveals a hidden order for a moment.",
    "A geometry appears when attention lingers.",
  ],
};

const MERIDIAN_ANCHORS: MeridianAnchor[] = [
  {
    id: "anchor_observatory_salle_cassini",
    h3: "PAR-14",
    label: "Salle Cassini",
    type: "measurement",
    location_hint: "Paris Observatory axis",
    constraints: {
      temporal: { mode: "solar_noon", window_minutes: 20 },
      presence: { min_pulses_20m: 4 },
    },
  },
  {
    id: "anchor_arago_pedestal_absence",
    h3: "PAR-14",
    label: "Arago Pedestal",
    type: "absence",
    location_hint: "Boulevard Arago",
    constraints: {
      spatial: { mode: "dwell", radius_m: 120 },
      presence: { min_pulses_20m: 3 },
    },
  },
  {
    id: "anchor_louvre_meridian_trace",
    h3: "PAR-01",
    label: "Arago Medallions",
    type: "alignment",
    location_hint: "Louvre / Palais Royal axis",
    constraints: {
      spatial: { mode: "linearity", min_displacement_m: 60 },
      presence: { min_pulses_20m: 3 },
    },
  },
  {
    id: "anchor_saint_sulpice_gnomon",
    h3: "PAR-06",
    label: "Saint-Sulpice Gnomon",
    type: "revelation",
    location_hint: "Saint-Sulpice transept",
    constraints: {
      temporal: { mode: "solar_noon", window_minutes: 15 },
      presence: { min_pulses_20m: 4 },
    },
  },
  {
    id: "anchor_pantheon_pendulum",
    h3: "PAR-05",
    label: "Foucault Pendulum",
    type: "threshold",
    location_hint: "PanthÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©on",
    constraints: {
      temporal: { mode: "daily_window", start_hour: 10, end_hour: 18 },
      presence: { min_pulses_20m: 3 },
    },
  },
  {
    id: "anchor_montsouris_mire_sud",
    h3: "PAR-14",
    label: "Mire du Sud",
    type: "measurement",
    location_hint: "Parc Montsouris",
    constraints: {
      spatial: { mode: "linearity", min_displacement_m: 80 },
      presence: { min_pulses_20m: 3 },
    },
  },
  {
    id: "anchor_montmartre_fizeau_leg",
    h3: "PAR-18",
    label: "Fizeau Mirror Leg",
    type: "threshold",
    location_hint: "Montmartre heights",
    constraints: {
      temporal: { mode: "daily_window", start_hour: 8, end_hour: 22 },
      presence: { min_pulses_20m: 3 },
    },
  },
];

function parseLawZone(raw: string | undefined): { arr: number; h3: string; zone_id: string } | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  let arr: number | null = null;
  const par = value.match(/^PAR-(\d{1,2})$/i);
  const paris = value.match(/^paris-(\d{1,2})$/i);
  if (par) arr = Number.parseInt(par[1], 10);
  else if (paris) arr = Number.parseInt(paris[1], 10);
  else if (/^\d{1,2}$/.test(value)) arr = Number.parseInt(value, 10);
  if (!arr || arr < 1 || arr > 20) return null;
  return {
    arr,
    h3: `PAR-${String(arr).padStart(2, "0")}`,
    zone_id: `paris-${arr}`,
  };
}

function anchorsForZone(h3: string): MeridianAnchor[] {
  return MERIDIAN_ANCHORS.filter((a) => a.h3 === h3);
}

function anchorTypesForZone(h3: string): AnchorType[] {
  const set = new Set<AnchorType>();
  for (const anchor of anchorsForZone(h3)) set.add(anchor.type);
  return Array.from(set);
}

function requiredPulsesForZone(h3: string): number {
  const anchored = anchorsForZone(h3)
    .map((a) => a.constraints?.presence?.min_pulses_20m ?? 0)
    .reduce((max, v) => Math.max(max, v), 0);
  return Math.max(PRESENCE_PULSE_MIN_FOR_RITUAL, anchored);
}

function presenceMeaningForZone(h3: string, pulses: number): string {
  const types = anchorTypesForZone(h3);
  if (pulses <= 0) return "The line remains latent.";
  if (types.includes("absence") && pulses >= 3) return "Absence turns into shared memory.";
  if (types.includes("measurement") && pulses >= 3) return "Presence begins to measure the world.";
  if (types.includes("revelation") && pulses >= 4) return "A hidden structure starts to disclose itself.";
  if (types.includes("threshold")) return "You are standing on a boundary.";
  if (types.includes("alignment")) return "The axis is becoming legible.";
  return "The city is noticing your persistence.";
}

function lawRefusal(
  c: any,
  reasonCode: string,
  message: string,
  nextUnlockHint: string,
  requirements: LawRequirement[],
  intent: string,
  zoneCtx: { h3: string; zone_id: string } | null,
  retryAfterSeconds?: number,
  contextExtra?: Record<string, unknown>
) {
  return c.json({
    allowed: false,
    reason_code: reasonCode,
    message,
    next_unlock_hint: nextUnlockHint,
    retry_after_seconds: retryAfterSeconds,
    requirements,
    policy: { law_version: LAW_VERSION, intent },
    context: zoneCtx ? { h3: zoneCtx.h3, zone_id: zoneCtx.zone_id, ...(contextExtra ?? {}) } : null,
  }, 200);
}

function lawAuthRequiredVerdict(zone: { h3: string; zone_id: string }, intent: string) {
  const anchors = anchorsForZone(zone.h3);
  return {
    allowed: false,
    reason_code: "AUTH_REQUIRED",
    message: "Not yet.",
    next_unlock_hint: "Pair your card to begin.",
    requirements: [{ type: "auth_session", status: "missing" }] as LawRequirement[],
    policy: { law_version: LAW_VERSION, intent },
    context: {
      h3: zone.h3,
      zone_id: zone.zone_id,
      anchor_types: anchorTypesForZone(zone.h3),
      anchor_ids: anchors.map((a) => a.id),
    },
  };
}

function parseSnapshotIncludes(raw: string | undefined): Set<string> {
  if (!raw || !raw.trim()) return new Set(["map"]);
  const parsed = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => ["map", "champ", "law"].includes(v));
  if (!parsed.length) return new Set(["map"]);
  return new Set(parsed);
}

function parseSnapshotZones(c: any): Array<{ arr: number; h3: string; zone_id: string }> {
  const h3CenterRaw = c.req.query("h3_center");
  const kRaw = c.req.query("k");
  const center = parseLawZone(h3CenterRaw);
  if (center) {
    const kParsed = Number.parseInt(kRaw ?? "2", 10);
    const k = Number.isFinite(kParsed) ? Math.max(0, Math.min(8, kParsed)) : 2;
    const out: Array<{ arr: number; h3: string; zone_id: string }> = [];
    for (let arr = Math.max(1, center.arr - k); arr <= Math.min(20, center.arr + k); arr++) {
      out.push({
        arr,
        h3: `PAR-${String(arr).padStart(2, "0")}`,
        zone_id: `paris-${arr}`,
      });
    }
    return out.slice(0, 30);
  }
  const all: Array<{ arr: number; h3: string; zone_id: string }> = [];
  for (let arr = 1; arr <= 20; arr++) {
    all.push({
      arr,
      h3: `PAR-${String(arr).padStart(2, "0")}`,
      zone_id: `paris-${arr}`,
    });
  }
  return all;
}

function stableZoneSeed(zoneH3: string): number {
  let acc = 0;
  for (let i = 0; i < zoneH3.length; i++) {
    acc = (acc + zoneH3.charCodeAt(i)) % 997;
  }
  return acc;
}

function buildSeedChampItemsForZone(
  zoneH3: string,
  nowMs: number,
  presenceRecent: number,
  existingChampCount: number
): Array<{ id: string; ts: string; h3: string; excerpt: string; origin: "system"; source: "seed" }> {
  const anchors = anchorsForZone(zoneH3);
  if (!anchors.length) return [];
  const targetCount = presenceRecent >= 4 ? 2 : 1;
  const missing = Math.max(0, targetCount - existingChampCount);
  if (missing <= 0) return [];

  const hourBucket = Math.floor(nowMs / (60 * 60 * 1000));
  const items: Array<{ id: string; ts: string; h3: string; excerpt: string; origin: "system"; source: "seed" }> = [];
  for (let i = 0; i < Math.min(missing, anchors.length); i++) {
    const anchor = anchors[(hourBucket + i) % anchors.length];
    if (!anchor) continue;
    const pool = CHAMP_SEED_BY_ANCHOR_TYPE[anchor.type] ?? DEFAULT_WHISPERS;
    const line = pool[(hourBucket + stableZoneSeed(zoneH3) + i) % pool.length] ?? pool[0];
    items.push({
      id: `seed:${zoneH3}:${anchor.id}:${hourBucket}:${i}`,
      ts: new Date(nowMs - i * 60_000).toISOString(),
      h3: zoneH3,
      excerpt: normalizeLegacyText(`${line} (${anchor.label})`),
      origin: "system",
      source: "seed",
    });
  }
  return items;
}

function computeZoneWhisper(
  zoneH3: string,
  presenceRecent: number,
  champRecent: number,
  mapRecent: number,
  nowMs: number
): string | null {
  const anchors = anchorsForZone(zoneH3);
  const minPresence = Math.max(
    WHISPER_MIN_PRESENCE,
    anchors
      .map((a) => a.constraints?.presence?.min_pulses_20m ?? 0)
      .reduce((max, v) => Math.max(max, v), 0)
  );
  if (presenceRecent < minPresence) {
    if (champRecent + mapRecent < 3) return null;
    const lowPresencePool = anchors.flatMap((a) => LOW_PRESENCE_WHISPERS_BY_ANCHOR_TYPE[a.type] ?? []);
    if (!lowPresencePool.length) return null;
    const rotationBucket = Math.floor(nowMs / (WHISPER_ROTATION_MINUTES * 60 * 1000));
    const idx = (rotationBucket + stableZoneSeed(zoneH3)) % lowPresencePool.length;
    const whisper = lowPresencePool[idx] ?? null;
    return whisper ? normalizeLegacyText(whisper) : null;
  }
  const cooldownBucket = Math.floor(nowMs / (WHISPER_COOLDOWN_MINUTES * 60 * 1000));
  const cooldownPhase = (cooldownBucket + (stableZoneSeed(zoneH3) % 2)) % 2;
  if (cooldownPhase === 1) return null;

  const anchorPool = anchors.flatMap((a) => WHISPERS_BY_ANCHOR_TYPE[a.type] ?? []);
  const pool = [...(ZONE_WHISPERS[zoneH3] ?? []), ...anchorPool, ...DEFAULT_WHISPERS];
  if (!pool.length) return null;
  const rotationBucket = Math.floor(nowMs / (WHISPER_ROTATION_MINUTES * 60 * 1000));
  const idx = rotationBucket % pool.length;
  const whisper = pool[idx] ?? null;
  return whisper ? normalizeLegacyText(whisper) : null;
}

function stableHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function parisDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function pickWeightedIndex<T extends { weight: number }>(items: T[], seed: string): number {
  if (!items.length) return -1;
  const total = items.reduce((sum, item) => sum + Math.max(1, item.weight), 0);
  const target = total > 0 ? stableHash(seed) % total : 0;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += Math.max(1, items[i].weight);
    if (target < acc) return i;
  }
  return 0;
}

function firstPreferredKind(
  items: Array<{ kind: CharacterFragmentKind }>,
  preferred: CharacterFragmentKind[]
): CharacterFragmentKind | null {
  for (const kind of preferred) {
    if (items.some((v) => v.kind === kind)) return kind;
  }
  return items[0]?.kind ?? null;
}

async function resolveCharacter(params: {
  supabase: ReturnType<typeof createClient>;
  cardId: string | null;
  zoneH3: string | null;
  acceptLanguage: string | undefined;
}): Promise<ResolvedCharacter | null> {
  const { supabase, cardId, zoneH3, acceptLanguage } = params;
  if (!zoneH3 || !/^PAR-\d{2}$/i.test(zoneH3)) return null;

  const anchorTypes = anchorsForZone(zoneH3).map((a) => a.type.toLowerCase());
  const anchorTypeSet = new Set(anchorTypes);
  const preferredLang = acceptLanguage?.toLowerCase().includes("en") ? "en" : "fr";

  const fetchFragments = async (lang: "fr" | "en") => {
    const { data, error } = await supabase
      .from("character_fragments")
      .select(`
        id,
        character_id,
        lang,
        kind,
        text,
        symbols,
        anchors,
        zones,
        cooldown_minutes,
        weight,
        characters!inner(
          id,
          slug,
          name,
          rules_json,
          is_active
        )
      `)
      .eq("is_active", true)
      .eq("lang", lang)
      .eq("characters.is_active", true)
      .limit(200);
    if (error) {
      console.error("[card-gate] resolve character fragments:", error);
      return [];
    }
    return data ?? [];
  };

  let rows = await fetchFragments(preferredLang as "fr" | "en");
  if (!rows.length && preferredLang === "en") {
    rows = await fetchFragments("fr");
  }
  if (!rows.length) return null;

  const filtered = rows.filter((row: any) => {
    const zones = (row.zones as string[] | null) ?? [];
    const anchors = ((row.anchors as string[] | null) ?? []).map((v) => String(v).toLowerCase());
    const zoneMatch = zones.length === 0 || zones.includes(zoneH3);
    const anchorMatch = anchors.length === 0 || anchors.some((a) => anchorTypeSet.has(a));
    return zoneMatch && anchorMatch;
  });
  if (!filtered.length) return null;

  type Fragment = {
    id: string;
    character_id: string;
    kind: CharacterFragmentKind;
    text: string;
    symbols: string[];
    cooldown_minutes: number;
    weight: number;
    character: { id: string; slug: string; name: string; rules_json: Record<string, unknown> | null };
  };
  const fragments: Fragment[] = filtered.map((row: any) => ({
    id: String(row.id),
    character_id: String(row.character_id),
    kind: (row.kind ?? "hint") as CharacterFragmentKind,
    text: normalizeLegacyText(String(row.text ?? "")),
    symbols: ((row.symbols as string[] | null) ?? []).map((v) => String(v)),
    cooldown_minutes: Number(row.cooldown_minutes ?? 180),
    weight: Number(row.weight ?? 1),
    character: {
      id: String(row.characters.id),
      slug: String(row.characters.slug),
      name: normalizeLegacyText(String(row.characters.name ?? "")),
      rules_json: (row.characters.rules_json as Record<string, unknown> | null) ?? null,
    },
  }));

  const now = new Date();
  const cooldownSinceIso = new Date(now.getTime() - CHARACTER_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
  const blockedCharacters = new Set<string>();
  if (cardId) {
    const { data: cooldownRows, error: cooldownError } = await supabase
      .from("character_encounters")
      .select("character_id")
      .eq("card_id", cardId)
      .eq("zone_h3", zoneH3)
      .gte("created_at", cooldownSinceIso)
      .limit(200);
    if (cooldownError) {
      console.error("[card-gate] resolve character cooldown:", cooldownError);
    } else {
      for (const row of cooldownRows ?? []) {
        const id = row.character_id as string | null;
        if (id) blockedCharacters.add(id);
      }
    }
  }

  const byCharacter = new Map<string, Fragment[]>();
  for (const fragment of fragments) {
    if (blockedCharacters.has(fragment.character_id)) continue;
    const arr = byCharacter.get(fragment.character_id) ?? [];
    arr.push(fragment);
    byCharacter.set(fragment.character_id, arr);
  }
  if (!byCharacter.size) return null;

  const dayKey = parisDayKey(now);
  const characterCandidates = Array.from(byCharacter.values()).map((group) => {
    const sample = group[0];
    return {
      id: sample.character_id,
      name: sample.character.name,
      slug: sample.character.slug,
      rules: sample.character.rules_json,
      fragments: group,
      weight: Math.max(1, group.reduce((sum, f) => sum + Math.max(1, f.weight), 0)),
    };
  });
  const charSeed = `${cardId ?? "anon"}|${zoneH3}|${dayKey}|character`;
  const characterIndex = pickWeightedIndex(characterCandidates, charSeed);
  const selected = characterCandidates[characterIndex];
  if (!selected) return null;

  const preferredKinds: CharacterFragmentKind[] = ["witness", "hint", "threshold", "echo", "warning"];
  const firstKind = firstPreferredKind(selected.fragments, preferredKinds);
  const firstPool = selected.fragments.filter((f) => f.kind === firstKind);
  const firstIdx = pickWeightedIndex(firstPool, `${cardId ?? "anon"}|${zoneH3}|${dayKey}|line-1`);
  const first = firstPool[firstIdx] ?? selected.fragments[0];
  const remaining = selected.fragments.filter((f) => f.id !== first.id);
  const secondKind = firstPreferredKind(
    remaining,
    first.kind === "echo" ? ["witness", "hint", "threshold", "warning"] : ["echo", "hint", "threshold", "warning", "witness"]
  );
  const secondPool = remaining.filter((f) => f.kind === secondKind);
  const secondIdx = pickWeightedIndex(secondPool, `${cardId ?? "anon"}|${zoneH3}|${dayKey}|line-2`);
  const second = secondPool[secondIdx] ?? null;

  const lines = [first?.text, second?.text]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, 2);
  if (!lines.length) return null;

  const echoFragment = [first, second].find((f) => f?.kind === "echo") ?? null;
  const echoSymbol = (echoFragment?.symbols?.[0] ?? selected.rules?.echo_symbol ?? null);
  const echoLocationHint = (selected.rules?.echo_location_hint as string | undefined) ?? undefined;
  const echo = echoFragment && echoLocationHint
    ? {
        location_hint: normalizeLegacyText(echoLocationHint),
        symbol: normalizeLegacyText(String(echoSymbol ?? "echo")),
      }
    : undefined;

  if (cardId) {
    const fragmentForLog = echoFragment ?? first;
    const { error: logError } = await supabase
      .from("character_encounters")
      .insert({
        card_id: cardId,
        character_id: selected.id,
        zone_h3: zoneH3,
        fragment_id: fragmentForLog?.id ?? null,
      });
    if (logError) {
      console.error("[card-gate] resolve character log:", logError);
    }
  }

  return {
    id: selected.slug,
    name: selected.name,
    lines,
    ...(echo ? { echo } : {}),
  };
}

// ----- Presence: POST /presence/pulse -----
app.post("/presence/pulse", async (c) => {
  const supabase = getSupabase();
  const session = await requireJwt(c);
  if (session instanceof Response) return session;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, session.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }

  let body: { h3?: string; ts?: string; speed_mps?: number; accuracy_m?: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const zone = parseLawZone(body?.h3);
  if (!zone) {
    return c.json({ error: "h3 required" }, 400);
  }

  const speedMps = typeof body?.speed_mps === "number" && Number.isFinite(body.speed_mps)
    ? Math.max(0, Math.min(20, body.speed_mps))
    : null;
  const accuracyM = typeof body?.accuracy_m === "number" && Number.isFinite(body.accuracy_m)
    ? Math.max(0, Math.min(500, body.accuracy_m))
    : null;

  const { data: lastPulse, error: lastPulseError } = await supabase
    .from("presence_pulses")
    .select("ts")
    .eq("card_id", session.card_id)
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastPulseError) {
    console.error("[card-gate] presence pulse last query:", lastPulseError);
    return c.json({ error: "Failed to record pulse" }, 500);
  }

  if (lastPulse?.ts) {
    const elapsed = Date.now() - new Date(lastPulse.ts as string).getTime();
    if (elapsed < PRESENCE_PULSE_COOLDOWN_MS) {
      return c.json({
        ok: false,
        accepted: false,
        cooldown_ms: PRESENCE_PULSE_COOLDOWN_MS,
        retry_after_ms: Math.max(1, PRESENCE_PULSE_COOLDOWN_MS - elapsed),
      }, 429);
    }
  }

  const { error: insertError } = await supabase
    .from("presence_pulses")
    .insert({
      card_id: session.card_id,
      h3: zone.h3,
      speed_mps: speedMps,
      accuracy_m: accuracyM,
      ts: new Date().toISOString(),
    });
  if (insertError) {
    console.error("[card-gate] presence pulse insert:", insertError);
    return c.json({ error: "Failed to record pulse" }, 500);
  }

  return c.json({
    ok: true,
    accepted: true,
    cooldown_ms: PRESENCE_PULSE_COOLDOWN_MS,
  });
});

const PRESENCE_VERIFY_COOLDOWN_S = 20;

const PRESENCE_WHISPER_KEYS = {
  SEARCHING: "presence.searching",
  UNCERTAIN: "presence.uncertain",
  WEAK: "presence.weak",
  RECOGNIZED: "presence.recognized",
  COOLDOWN: "presence.cooldown",
  OUTSIDE: "presence.outside",
  NO_CARD: "presence.no_card",
  ERROR: "presence.error",
  TELEPORT: "presence.teleport",
} as const;

const PRESENCE_TELEPORT_MAX_MPS = 12;
const PRESENCE_LAST_EVENT_WINDOW_MS = 3 * 60 * 1000;

function presenceQuantize(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.round(lat * 10000) / 10000,
    lng: Math.round(lng * 10000) / 10000,
  };
}

function presenceAccuracyBucket(accuracyM: number): "<=20" | "20-60" | "60-80" | ">80" {
  if (accuracyM <= 20) return "<=20";
  if (accuracyM <= 60) return "20-60";
  if (accuracyM <= 80) return "60-80";
  return ">80";
}

/** Deterministic 10% sample for success telemetry (same card+zone+day => same result). */
function presenceSampleSuccess(cardId: string, zoneId: string | null): boolean {
  const parisDate = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const zonePart = zoneId != null && zoneId !== "" ? zoneId : "_";
  const s = `${cardId}|${zonePart}|${parisDate}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 100) < 10;
}

// ----- Presence: POST /presence/verify -----
app.post("/presence/verify", async (c) => {
  const supabase = getSupabase();
  const session = await requireJwt(c);
  if (session instanceof Response) return session;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, session.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }

  let body: {
    zoneId?: string;
    zone?: { lat: number; lng: number; radiusM: number };
    mode?: string;
    samples?: Array<{ lat: number; lng: number; accuracy: number; ts: number; speed?: number | null; heading?: number | null }>;
    client?: { ua?: string; platform?: string };
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const debugPresence = Deno.env.get("DEBUG_PRESENCE") === "true";
  if (body.zone && !debugPresence) {
    return c.json({ error: "Zone from client not accepted in production" }, 400);
  }
  if (!presenceAllowZoneFromBody(body, debugPresence)) {
    return c.json({ error: "Zone from client not accepted" }, 400);
  }

  const samples = Array.isArray(body?.samples) ? body.samples : [];
  if (samples.length < 1 || samples.length > 15) {
    return c.json({ error: "samples length must be 1..15" }, 400);
  }
  const sane = samples.every(
    (s) =>
      typeof s?.lat === "number" &&
      typeof s?.lng === "number" &&
      typeof s?.accuracy === "number" &&
      typeof s?.ts === "number" &&
      Number.isFinite(s.lat) &&
      Number.isFinite(s.lng) &&
      s.accuracy >= 0 &&
      s.ts > 0
  );
  if (!sane) {
    return c.json({ error: "Invalid sample values" }, 400);
  }

  const cooldownKey = `presence_verify:${session.card_id}`;
  if (!(await dbRateLimit(supabase, cooldownKey, 1, PRESENCE_VERIFY_COOLDOWN_S))) {
    const cors = getCorsHeaders(c);
    return new Response(
      JSON.stringify({
        ok: false,
        grade: "LOW",
        reasonCode: "COOLDOWN",
        whisperKey: PRESENCE_WHISPER_KEYS.COOLDOWN,
        whisper: "Attends un peu avant de revÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier.",
        serverTs: Date.now(),
      }),
      { status: 200, headers: { ...cors, "Content-Type": JSON_UTF8 } }
    );
  }

  const trust = computeTrust(samples);
  const grade = trust.grade;
  const best = trust.best;

  let lastEvent: { ts: string; lat: number; lng: number } | null = null;
  const { data: lastEventRow, error: lastEventErr } = await supabase
    .from("presence_events")
    .select("ts, lat, lng")
    .eq("card_id", session.card_id)
    .maybeSingle();
  if (!lastEventErr && lastEventRow) lastEvent = lastEventRow as typeof lastEvent;
  if (lastEvent && best) {
    const lastTs = new Date(lastEvent.ts as string).getTime();
    const now = Date.now();
    if (now - lastTs < PRESENCE_LAST_EVENT_WINDOW_MS) {
      const distM = haversineMeters(
        lastEvent.lat as number,
        lastEvent.lng as number,
        best.lat,
        best.lng
      );
      const deltaTs = Math.max(0.1, (best.ts - lastTs) / 1000);
      if (deltaTs > 0) {
        const speedMps = distM / deltaTs;
        if (speedMps > PRESENCE_TELEPORT_MAX_MPS) {
          const cors = getCorsHeaders(c);
          return new Response(
            JSON.stringify({
              ok: false,
              grade: "LOW",
              reasonCode: "TELEPORT",
              whisperKey: PRESENCE_WHISPER_KEYS.TELEPORT,
              whisper: "DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©placement trop rapide ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â la ville refuse.",
              serverTs: Date.now(),
            }),
            { status: 200, headers: { ...cors, "Content-Type": JSON_UTF8 } }
          );
        }
      }
    }
  }

  let zoneCenter: { lat: number; lng: number } | null = null;
  let zoneRadiusM = 0;
  if (debugPresence && body.zone && typeof body.zone.lat === "number" && typeof body.zone.lng === "number" && typeof body.zone.radiusM === "number") {
    zoneCenter = { lat: body.zone.lat, lng: body.zone.lng };
    zoneRadiusM = Math.max(0, Math.min(500, body.zone.radiusM));
  }
  if (body.zoneId && !zoneCenter) {
    const z = getPresenceZone(body.zoneId);
    if (z) {
      zoneCenter = { lat: z.lat, lng: z.lng };
      zoneRadiusM = z.radiusM;
    }
  }

  let inside: boolean | undefined;
  let effectiveRadius: number | undefined;
  let distance: number | undefined;
  if (zoneCenter && best) {
    effectiveRadius = zoneRadiusM + best.accuracy;
    distance = haversineMeters(best.lat, best.lng, zoneCenter.lat, zoneCenter.lng);
    inside = distance <= effectiveRadius;
  }

  let reasonCode: "OK" | "LOW_TRUST" | "OUTSIDE_ZONE" | "COOLDOWN" | "NO_CARD" = "OK";
  let whisperKey: string;
  let whisper: string | undefined;
  if (grade === "LOW") {
    reasonCode = "LOW_TRUST";
    whisperKey = PRESENCE_WHISPER_KEYS.WEAK;
    whisper = "Signal trop faible ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â approche-toi de l'air libre.";
  } else if (zoneCenter !== undefined && zoneCenter !== null && inside === false) {
    reasonCode = "OUTSIDE_ZONE";
    whisperKey = PRESENCE_WHISPER_KEYS.OUTSIDE;
    whisper = "Tu n'es pas dans le lieu attendu.";
  } else if (grade === "MED") {
    whisperKey = PRESENCE_WHISPER_KEYS.UNCERTAIN;
    whisper = "Signal incertain ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â la ville hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©site.";
  } else {
    whisperKey = PRESENCE_WHISPER_KEYS.RECOGNIZED;
    whisper = "PrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sence reconnue.";
  }

  const ok = grade !== "LOW" && (zoneCenter == null || inside === true);

  try {
    if (ok && best) {
      const q = presenceQuantize(best.lat, best.lng);
      await supabase
        .from("presence_events")
        .upsert(
          {
            card_id: session.card_id,
            ts: new Date(best.ts).toISOString(),
            lat: q.lat,
            lng: q.lng,
            grade,
            zone_id: body.zoneId ?? null,
          },
          { onConflict: "card_id" }
        );
    }
    const accuracyBucket = best ? presenceAccuracyBucket(best.accuracy) : ">80";
    const shouldLogTelemetry = !ok || presenceSampleSuccess(session.card_id, body.zoneId ?? null);
    if (shouldLogTelemetry) {
      await supabase.from("presence_telemetry").insert({
        card_id: session.card_id,
        zone_id: body.zoneId ?? null,
        grade,
        ok,
        reason_code: reasonCode,
        accuracy_bucket: accuracyBucket,
        ts: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("[card-gate] presence events/telemetry write:", e);
  }

  const includeDebug = debugPresence && effectiveRadius != null && distance != null;
  const cors = getCorsHeaders(c);
  return new Response(
    JSON.stringify({
      ok,
      grade,
      inside: zoneCenter != null ? inside : undefined,
      reasonCode,
      whisperKey,
      whisper,
      serverTs: Date.now(),
      ...(includeDebug ? { debug: { effectiveRadius, distance } } : {}),
    }),
    { status: 200, headers: { ...cors, "Content-Type": JSON_UTF8 } }
  );
});

// ----- Law: GET /law/evaluate -----
app.get("/law/evaluate", async (c) => {
  const supabase = getSupabase();
  const intent = (c.req.query("intent") ?? "").trim();
  const zoneParam = (c.req.query("h3") ?? c.req.query("zone_id") ?? "").trim();
  const zone = parseLawZone(zoneParam);

  if (!zone) {
    return lawRefusal(
      c,
      "UNKNOWN_ZONE",
      "Not yet.",
      "Move to a known zone and try again.",
      [{ type: "zone", status: "missing" }],
      intent || "unknown",
      null
    );
  }
  const zoneAnchors = anchorsForZone(zone.h3);
  const zoneAnchorTypes = anchorTypesForZone(zone.h3);
  const contextExtra = {
    anchor_types: zoneAnchorTypes,
    anchor_ids: zoneAnchors.map((a) => a.id),
  };
  const requiredPresencePulses = requiredPulsesForZone(zone.h3);

  const isProtected = PROTECTED_INTENTS.has(intent);
  const payload = isProtected ? await requireJwt(c) : await requireOptionalJwt(c);
  if (isProtected && payload instanceof Response) {
    return lawRefusal(
      c,
      "AUTH_REQUIRED",
      "Not yet.",
      "Reconnect your card session first.",
      [{ type: "auth_session", status: "missing" }],
      intent,
      zone,
      undefined,
      contextExtra
    );
  }
  const session = payload instanceof Response ? null : payload;

  if (intent === "ritual.start" && session) {
    const ip = getClientIp(c);
    if (!(await rateLimitMap(supabase, session.card_id, ip))) {
      return lawRefusal(
        c,
        "THRESHOLD_NOT_MET",
        "Not yet.",
        "Wait and return in a moment.",
        [{ type: "rate_window", status: "blocked" }],
        intent,
        zone,
        120,
        contextExtra
      );
    }

    const [inscriptionsRes, segmentsRes] = await Promise.all([
      supabase
        .from("inscriptions")
        .select("created_at")
        .eq("card_id", session.card_id)
        .eq("arrondissement", zone.arr)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("engraved_segments")
        .select("created_at")
        .eq("card_id", session.card_id)
        .or(`from_arrondissement.eq.${zone.arr},to_arrondissement.eq.${zone.arr}`)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (inscriptionsRes.error || segmentsRes.error) {
      console.error("[card-gate] law evaluate query:", inscriptionsRes.error ?? segmentsRes.error);
      return c.json({ error: "Failed to evaluate law" }, 500);
    }

    const hasActivation = (inscriptionsRes.data?.length ?? 0) > 0 || (segmentsRes.data?.length ?? 0) > 0;
    if (!hasActivation) {
      return lawRefusal(
        c,
        "NEEDS_ACTIVATION",
        "Not yet.",
        "Return after you complete the zone activation.",
        [
          { type: "zone_activation", status: "missing" },
          { type: "presence_pulses", min: requiredPresencePulses, within_minutes: PRESENCE_PULSE_WINDOW_MINUTES, status: "missing" },
        ],
        intent,
        zone,
        undefined,
        contextExtra
      );
    }

    const pulseSinceIso = new Date(Date.now() - PRESENCE_PULSE_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count: pulseCountRaw, error: pulseCountError } = await supabase
      .from("presence_pulses")
      .select("id", { count: "exact", head: true })
      .eq("card_id", session.card_id)
      .eq("h3", zone.h3)
      .gte("ts", pulseSinceIso);
    if (pulseCountError) {
      console.error("[card-gate] law evaluate presence query:", pulseCountError);
      return c.json({ error: "Failed to evaluate law" }, 500);
    }
    const pulseCount = pulseCountRaw ?? 0;
    if (pulseCount < requiredPresencePulses) {
      return lawRefusal(
        c,
        "THRESHOLD_NOT_MET",
        "Not yet.",
        "Stay with the line a little longer.",
        [
          {
            type: "presence_pulses",
            min: requiredPresencePulses,
            within_minutes: PRESENCE_PULSE_WINDOW_MINUTES,
            count: pulseCount,
            status: "missing",
          },
        ],
        intent,
        zone,
        undefined,
        contextExtra
      );
    }

    const parisHour = Number.parseInt(
      new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Europe/Paris",
      }).format(new Date()),
      10
    );
    if (parisHour >= 2 && parisHour < 5) {
      return lawRefusal(
        c,
        "SILENCE_WINDOW",
        "Not yet.",
        "Return when the silence window has passed.",
        [{ type: "silence_window", status: "blocked" }],
        intent,
        zone,
        3600,
        contextExtra
      );
    }

    const cooldownKey = `law:${intent}:${session.card_id}:${zone.zone_id}`;
    const cooldownAllowed = await dbRateLimit(supabase, cooldownKey, 1, 120);
    if (!cooldownAllowed) {
      return lawRefusal(
        c,
        "COOLDOWN_ACTIVE",
        "Not yet.",
        "Wait before starting this ritual again.",
        [{ type: "cooldown", within_minutes: 2, status: "blocked" }],
        intent,
        zone,
        120,
        contextExtra
      );
    }

    return c.json({
      allowed: true,
      reason_code: "OK",
      message: "Open.",
      next_unlock_hint: null,
      requirements: [
        { type: "zone_activation", status: "ok" },
        { type: "presence_pulses", min: requiredPresencePulses, within_minutes: PRESENCE_PULSE_WINDOW_MINUTES, count: pulseCount, status: "ok" },
        { type: "silence_window", status: "ok" },
      ],
      policy: { law_version: LAW_VERSION, intent },
      context: { h3: zone.h3, zone_id: zone.zone_id, ...contextExtra },
    });
  }

  return c.json({
    allowed: true,
    reason_code: "OK",
    message: "Open.",
    next_unlock_hint: null,
    requirements: [] as LawRequirement[],
    policy: { law_version: LAW_VERSION, intent: intent || "unknown" },
    context: { h3: zone.h3, zone_id: zone.zone_id, ...contextExtra },
  });
});

// ----- World: GET /world/snapshot -----
app.get("/world/snapshot", async (c) => {
  const supabase = getSupabase();
  const include = parseSnapshotIncludes(c.req.query("include"));
  const zonesInView = parseSnapshotZones(c);
  const zoneArrSet = new Set(zonesInView.map((z) => z.arr));
  const zoneH3Set = new Set(zonesInView.map((z) => z.h3));
  const zoneByArr = new Map<number, { arr: number; h3: string; zone_id: string }>(
    zonesInView.map((z) => [z.arr, z])
  );
  const payload = await requireOptionalJwt(c);
  const isAuthed = Boolean(payload);
  const ip = getClientIp(c);
  const allowed = isAuthed
    ? await rateLimitMap(supabase, payload!.card_id, ip)
    : await rateLimitMapPublic(supabase, ip);
  if (!allowed) return c.json({ error: "Too many requests" }, 429);

  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const mapLimit = Math.max(120, zonesInView.length * 20);
  const worldMapItems: Array<{ id: string; h3: string; ts: string; excerpt: string }> = [];
  const worldChampItems: Array<{
    id: string;
    ts: string;
    h3: string;
    excerpt: string;
    origin: "user" | "system";
    source: "inscription" | "seed";
  }> = [];
  const mapCountByH3 = new Map<string, number>();
  const champCountByH3 = new Map<string, number>();
  const presenceCountByH3 = new Map<string, number>();

  const needMap = include.has("map");
  const needChamp = include.has("champ");
  if (needMap || needChamp) {
    const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const baseQuery = supabase
      .from("inscriptions")
      .select("id, arrondissement, text, created_at")
      .eq("opt_in_field", true)
      .not("arrondissement", "is", null)
      .order("created_at", { ascending: false })
      .limit(mapLimit);
    const { data: rows, error } = needChamp
      ? await baseQuery.gte("created_at", sinceIso)
      : await baseQuery;
    if (error) {
      console.error("[card-gate] world snapshot inscriptions:", error);
      return c.json({ error: "Failed to load world snapshot" }, 500);
    }
    for (const row of rows ?? []) {
      const arr = row.arrondissement as number | null;
      if (typeof arr !== "number" || !zoneArrSet.has(arr)) continue;
      const zone = zoneByArr.get(arr);
      if (!zone) continue;
      const text = normalizeLegacyText(String(row.text ?? ""));
      const excerpt = text.length > 64 ? `${text.slice(0, 61)}...` : text;
      if (needMap) {
        worldMapItems.push({
          id: row.id as string,
          h3: zone.h3,
          ts: (row.created_at as string) ?? nowIso,
          excerpt,
        });
        mapCountByH3.set(zone.h3, (mapCountByH3.get(zone.h3) ?? 0) + 1);
      }
      if (needChamp) {
        worldChampItems.push({
          id: row.id as string,
          h3: zone.h3,
          ts: (row.created_at as string) ?? nowIso,
          excerpt,
          origin: "user",
          source: "inscription",
        });
        champCountByH3.set(zone.h3, (champCountByH3.get(zone.h3) ?? 0) + 1);
      }
    }
  }

  const presenceSinceIso = new Date(nowMs - PRESENCE_PULSE_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { data: presenceRows, error: presenceRowsError } = await supabase
    .from("presence_pulses")
    .select("h3")
    .in("h3", zonesInView.map((z) => z.h3))
    .gte("ts", presenceSinceIso)
    .limit(5000);
  if (presenceRowsError) {
    console.error("[card-gate] world snapshot presence signals:", presenceRowsError);
  } else {
    for (const row of presenceRows ?? []) {
      const h3 = row.h3 as string | null;
      if (!h3 || !zoneH3Set.has(h3)) continue;
      presenceCountByH3.set(h3, (presenceCountByH3.get(h3) ?? 0) + 1);
    }
  }

  if (needChamp) {
    for (const zone of zonesInView) {
      const existingChamp = champCountByH3.get(zone.h3) ?? 0;
      const presenceRecent = presenceCountByH3.get(zone.h3) ?? 0;
      const seededItems = buildSeedChampItemsForZone(zone.h3, nowMs, presenceRecent, existingChamp);
      for (const item of seededItems) {
        worldChampItems.push(item);
      }
      if (seededItems.length > 0) {
        champCountByH3.set(zone.h3, existingChamp + seededItems.length);
      }
    }
  }

  const lawByH3 = new Map<string, Record<string, unknown>>();
  if (include.has("law")) {
    const intent = "ritual.start";
    let activatedArr = new Set<number>();
    const pulsesByH3 = new Map<string, number>();
    if (isAuthed && payload) {
      const pulseSinceIso = new Date(Date.now() - PRESENCE_PULSE_WINDOW_MINUTES * 60 * 1000).toISOString();
      const [inscriptionsRes, segmentsRes, pulsesRes] = await Promise.all([
        supabase
          .from("inscriptions")
          .select("arrondissement")
          .eq("card_id", payload.card_id)
          .in("arrondissement", zonesInView.map((z) => z.arr))
          .limit(500),
        supabase
          .from("engraved_segments")
          .select("from_arrondissement, to_arrondissement")
          .eq("card_id", payload.card_id)
          .or(
            zonesInView
              .map((z) => `from_arrondissement.eq.${z.arr},to_arrondissement.eq.${z.arr}`)
              .join(",")
          )
          .limit(500),
        supabase
          .from("presence_pulses")
          .select("h3")
          .eq("card_id", payload.card_id)
          .in("h3", zonesInView.map((z) => z.h3))
          .gte("ts", pulseSinceIso)
          .limit(2000),
      ]);
      if (inscriptionsRes.error || segmentsRes.error || pulsesRes.error) {
        console.error("[card-gate] world snapshot law queries:", inscriptionsRes.error ?? segmentsRes.error ?? pulsesRes.error);
        return c.json({ error: "Failed to load world snapshot law" }, 500);
      }
      for (const row of inscriptionsRes.data ?? []) {
        const arr = row.arrondissement as number | null;
        if (typeof arr === "number" && zoneArrSet.has(arr)) activatedArr.add(arr);
      }
      for (const row of segmentsRes.data ?? []) {
        const from = row.from_arrondissement as number | null;
        const to = row.to_arrondissement as number | null;
        if (typeof from === "number" && zoneArrSet.has(from)) activatedArr.add(from);
        if (typeof to === "number" && zoneArrSet.has(to)) activatedArr.add(to);
      }
      for (const row of pulsesRes.data ?? []) {
        const h3 = row.h3 as string | null;
        if (!h3 || !zoneH3Set.has(h3)) continue;
        pulsesByH3.set(h3, (pulsesByH3.get(h3) ?? 0) + 1);
      }
    }
    const parisHour = Number.parseInt(
      new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", hour12: false, timeZone: "Europe/Paris" }).format(new Date()),
      10
    );
    for (const zone of zonesInView) {
      if (!isAuthed) {
        lawByH3.set(zone.h3, { [intent]: lawAuthRequiredVerdict(zone, intent) });
        continue;
      }
      if (!activatedArr.has(zone.arr)) {
        lawByH3.set(zone.h3, {
          [intent]: {
            allowed: false,
            reason_code: "NEEDS_ACTIVATION",
            message: "Not yet.",
            next_unlock_hint: "Return after you complete the zone activation.",
          },
        });
        continue;
      }
      const pulseCount = pulsesByH3.get(zone.h3) ?? 0;
      if (pulseCount < PRESENCE_PULSE_MIN_FOR_RITUAL) {
        lawByH3.set(zone.h3, {
          [intent]: {
            allowed: false,
            reason_code: "THRESHOLD_NOT_MET",
            message: "Not yet.",
            next_unlock_hint: "Stay in the zone a little longer.",
            requirements: [
              {
                type: "presence_pulses",
                min: PRESENCE_PULSE_MIN_FOR_RITUAL,
                within_minutes: PRESENCE_PULSE_WINDOW_MINUTES,
                count: pulseCount,
              },
            ],
          },
        });
        continue;
      }
      if (parisHour >= 2 && parisHour < 5) {
        lawByH3.set(zone.h3, {
          [intent]: {
            allowed: false,
            reason_code: "SILENCE_WINDOW",
            message: "Not yet.",
            next_unlock_hint: "Return when the silence window has passed.",
            retry_after_seconds: 3600,
          },
        });
        continue;
      }
      lawByH3.set(zone.h3, {
        [intent]: {
          allowed: true,
          reason_code: "OK",
          message: "Open.",
          next_unlock_hint: null,
        },
      });
    }
  }

  const meZones: Record<string, { progress: Record<string, unknown> | null; activation: Record<string, unknown> | null; presence: { pulses_20m: number; last_ts: string | null; meaning: string } }> = {};
  let inscriptionsCount = 0;
  if (isAuthed && payload) {
    const pulseSinceIso = new Date(Date.now() - PRESENCE_PULSE_WINDOW_MINUTES * 60 * 1000).toISOString();
    const [inscriptionsRes, segmentsRes, pulsesRes] = await Promise.all([
      supabase
        .from("inscriptions")
        .select("arrondissement, created_at")
        .eq("card_id", payload.card_id)
        .in("arrondissement", zonesInView.map((z) => z.arr))
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("engraved_segments")
        .select("from_arrondissement, to_arrondissement, created_at")
        .eq("card_id", payload.card_id)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("presence_pulses")
        .select("h3, ts")
        .eq("card_id", payload.card_id)
        .in("h3", zonesInView.map((z) => z.h3))
        .gte("ts", pulseSinceIso)
        .order("ts", { ascending: false })
        .limit(2000),
    ]);
    if (!inscriptionsRes.error && !segmentsRes.error && !pulsesRes.error) {
      inscriptionsCount = (inscriptionsRes.data ?? []).length;
      const progressByArr = new Map<number, { entered_at: string | null; engraved_at: string | null }>();
      const presenceByH3 = new Map<string, { pulses_20m: number; last_ts: string | null }>();
      const ensure = (arr: number) => {
        if (!progressByArr.has(arr)) progressByArr.set(arr, { entered_at: null, engraved_at: null });
        return progressByArr.get(arr)!;
      };
      for (const row of inscriptionsRes.data ?? []) {
        const arr = row.arrondissement as number | null;
        if (typeof arr !== "number" || !zoneArrSet.has(arr)) continue;
        const p = ensure(arr);
        p.engraved_at = p.engraved_at ?? (row.created_at as string);
        p.entered_at = p.entered_at ?? (row.created_at as string);
      }
      for (const row of segmentsRes.data ?? []) {
        const candidates = [row.from_arrondissement as number | null, row.to_arrondissement as number | null];
        for (const arr of candidates) {
          if (typeof arr !== "number" || !zoneArrSet.has(arr)) continue;
          const p = ensure(arr);
          p.entered_at = p.entered_at ?? (row.created_at as string);
        }
      }
      for (const row of pulsesRes.data ?? []) {
        const h3 = row.h3 as string | null;
        const ts = row.ts as string | null;
        if (!h3 || !zoneH3Set.has(h3)) continue;
        const current = presenceByH3.get(h3) ?? { pulses_20m: 0, last_ts: null };
        current.pulses_20m += 1;
        current.last_ts = current.last_ts ?? ts;
        presenceByH3.set(h3, current);
      }
      for (const zone of zonesInView) {
        const p = progressByArr.get(zone.arr);
        const presence = presenceByH3.get(zone.h3) ?? { pulses_20m: 0, last_ts: null };
        meZones[zone.h3] = {
          progress: p
            ? {
                zone_id: zone.zone_id,
                entered: p.entered_at != null,
                entered_at: p.entered_at,
                engraved: p.engraved_at != null,
                engraved_at: p.engraved_at,
              }
            : null,
          activation: lawByH3.get(zone.h3)?.["ritual.start"] as Record<string, unknown> | null ?? null,
          presence: {
            pulses_20m: presence.pulses_20m,
            last_ts: presence.last_ts,
            meaning: presenceMeaningForZone(zone.h3, presence.pulses_20m),
          },
        };
      }
    }
  } else {
    for (const zone of zonesInView) {
      meZones[zone.h3] = {
        progress: null,
        activation: null,
        presence: {
          pulses_20m: 0,
          last_ts: null,
          meaning: presenceMeaningForZone(zone.h3, 0),
        },
      };
    }
  }
  for (const zone of zonesInView) {
    if (!meZones[zone.h3]) {
      meZones[zone.h3] = {
        progress: null,
        activation: null,
        presence: {
          pulses_20m: 0,
          last_ts: null,
          meaning: presenceMeaningForZone(zone.h3, 0),
        },
      };
    }
  }

  const h3CenterRaw = c.req.query("h3_center");
  const centerZone = parseLawZone(h3CenterRaw);
  const outsideCharacterScope = Boolean(h3CenterRaw && !centerZone);
  let characterZoneH3 = centerZone?.h3 ?? zonesInView[0]?.h3 ?? null;
  if (!centerZone && isAuthed) {
    let best: { h3: string; pulses: number } | null = null;
    for (const [h3, zone] of Object.entries(meZones)) {
      const pulses = Number(zone?.presence?.pulses_20m ?? 0);
      if (!best || pulses > best.pulses) best = { h3, pulses };
    }
    if (best?.h3) characterZoneH3 = best.h3;
  }
  const resolvedCharacter = outsideCharacterScope
    ? null
    : await resolveCharacter({
        supabase,
        cardId: isAuthed && payload ? payload.card_id : null,
        zoneH3: characterZoneH3,
        acceptLanguage: c.req.header("Accept-Language"),
      });

  // ----- me.aura: single source of truth for Aura page -----
  let meAura: {
    mode: "seek" | "scan" | "archive" | "ritual";
    title: string;
    nextTitle?: string | null;
    axes: { clarte: number; anchorage: number; echo: number; mouvement: number; alignement: number; ombre: number };
    reading: { cycle: number; tension: number; trend: -1 | 0 | 1; waveSeed: string };
    vestige: { status: "none" | "detected" | "crystallizing" | "figure" | "named"; hint?: string | null; statueKey?: string | null; revealLocked?: boolean };
    questCallout: {
      id: string;
      title: string;
      subtitle?: string | null;
      ctaLabel: string;
      action: "open_oracle" | "open_place" | "open_map" | "none";
      locked?: boolean;
      reasonLocked?: string | null;
    } | null;
    oracle: { eligible: boolean; message: string | null; source: "daily" | "event" | "manual"; cooldownEndsAt: string | null };
    seals: string[];
  };
  if (isAuthed && payload) {
    const { data: auraRow } = await supabase.from("aura_profiles").select("aura_level, aura_points, status, last_quest_at, seals").eq("card_id", payload.card_id).single();
    const auraLevel = auraRow?.aura_level ?? 0;
    const auraPoints = auraRow?.aura_points ?? 0;
    const status = auraRow?.status ?? "Quiet";
    const cardId = payload.card_id;
    const dateSeed = new Date().toISOString().slice(0, 10);
    const seedStr = `${cardId}:${dateSeed}`;
    let seedNum = 0;
    for (let i = 0; i < seedStr.length; i++) seedNum = (seedNum * 31 + seedStr.charCodeAt(i)) >>> 0;
    const tension = (seedNum % 1000) / 1000;
    const cycle = 1 + (Math.floor(seedNum / 1000) % 4);
    const trend = (seedNum % 3) - 1 as -1 | 0 | 1;
    const waveSeed = seedStr.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(36);
    const baseAxis = Math.min(1, 0.2 + (auraPoints / 100) * 0.3);
    const axes = {
      clarte: Math.min(1, baseAxis + (seedNum % 17) / 100),
      anchorage: Math.min(1, baseAxis + ((seedNum >> 4) % 17) / 100),
      echo: Math.min(1, baseAxis + ((seedNum >> 8) % 17) / 100),
      mouvement: Math.min(1, baseAxis + ((seedNum >> 12) % 17) / 100),
      alignement: Math.min(1, baseAxis + ((seedNum >> 16) % 17) / 100),
      ombre: Math.min(1, baseAxis + ((seedNum >> 20) % 17) / 100),
    };
    const vestigeStatus = axes.ombre > 0.55 ? "detected" : "none";
    meAura = {
      mode: "seek",
      title: status,
      nextTitle: null,
      axes,
      reading: { cycle, tension, trend, waveSeed },
      vestige: { status: vestigeStatus, hint: vestigeStatus === "detected" ? "Une forme commence..." : null, statueKey: null, revealLocked: false },
      questCallout: { id: "question", title: "Question", subtitle: "La ville rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©pond.", ctaLabel: "ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°COUTER ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢", action: "open_oracle", locked: false, reasonLocked: null },
      oracle: { eligible: true, message: null, source: "daily", cooldownEndsAt: null },
      seals: Array.isArray(auraRow?.seals) ? auraRow.seals : [],
    };
  } else {
    const dateSeed = new Date().toISOString().slice(0, 10);
    const seedStr = `anon:${dateSeed}`;
    let seedNum = 0;
    for (let i = 0; i < seedStr.length; i++) seedNum = (seedNum * 31 + seedStr.charCodeAt(i)) >>> 0;
    const tension = (seedNum % 1000) / 1000;
    const cycle = 1 + (Math.floor(seedNum / 1000) % 4);
    const trend = (seedNum % 3) - 1 as -1 | 0 | 1;
    const waveSeed = seedStr.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(36);
    meAura = {
      mode: "seek",
      title: "Citoyen",
      nextTitle: null,
      axes: { clarte: 0.2, anchorage: 0.2, echo: 0.2, mouvement: 0.2, alignement: 0.2, ombre: 0.2 },
      reading: { cycle, tension, trend, waveSeed },
      vestige: { status: "none", hint: null, statueKey: null, revealLocked: false },
      questCallout: null,
      oracle: { eligible: false, message: null, source: "daily", cooldownEndsAt: null },
      seals: [],
    };
  }

  const response = {
    now: nowIso,
    policy: {
      world_version: WORLD_VERSION,
      cache: { public_s_maxage: 60, public_swr: 600 },
    },
    world: {
      zones: zonesInView.map((zone) => {
        const mapCount = mapCountByH3.get(zone.h3) ?? 0;
        const champCount = champCountByH3.get(zone.h3) ?? 0;
        const presenceRecent = presenceCountByH3.get(zone.h3) ?? 0;
        const whisper = computeZoneWhisper(zone.h3, presenceRecent, champCount, mapCount, nowMs);
        const zoneAnchors = anchorsForZone(zone.h3);
        return {
          h3: zone.h3,
          title: `Zone ${zone.h3}`,
          fog: { level: 0.72 },
          signals: {
            inscriptions_recent: mapCount,
            champ_recent: champCount,
            whisper,
          },
          anchors: zoneAnchors,
          law: include.has("law") ? (lawByH3.get(zone.h3) ?? {}) : {},
        };
      }),
      map: include.has("map") ? { inscriptions: worldMapItems.slice(0, 300) } : { inscriptions: [] },
      champ: include.has("champ") ? { items: worldChampItems.slice(0, 100) } : { items: [] },
    },
    me: {
      authenticated: isAuthed,
      card_id: isAuthed && payload ? payload.card_id : null,
      zones: meZones,
      character: resolvedCharacter,
      aura: meAura,
      monParis: (() => {
        const parisDate = getTodayParisDate();
        const entry = selectMonParisEntry(meZones, meAura, inscriptionsCount, zonesInView, parisDate);
        const reading = selectMonParisReading(meZones, meAura, inscriptionsCount, parisDate, isAuthed && payload ? payload.card_id : null);
        return { entry, ...(reading ? { reading } : {}) };
      })(),
    },
  };

  if (isAuthed) {
    c.header("Cache-Control", "private, no-store");
    c.header("Vary", "Authorization, X-ARCHE-CARD-CODE, X-ARCHE-SESSION");
  } else {
    c.header("Cache-Control", MAP_CACHE_CONTROL_PUBLIC);
  }
  return c.json(response);
});

// ----- /journal/list -----
app.get("/journal/list", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitJournal(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, content, place_id, created_at, updated_at")
    .eq("card_id", payload.card_id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[card-gate] journal list:", error);
    return c.json({ error: "Failed to load journal" }, 500);
  }
  return c.json({ entries: data ?? [] });
});

// ----- /journal/note (GET) -----
// Use limit(1) + data[0] instead of maybeSingle(): with historical duplicates on (card_id, place_id), maybeSingle() can error and cause 500.
app.get("/journal/note", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const placeId = c.req.query("place_id") ?? "__my_paris__";
  const ip = getClientIp(c);
  if (!(await rateLimitJournal(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, content, updated_at")
    .eq("card_id", payload.card_id)
    .eq("place_id", placeId)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (error) return c.json({ error: "Failed to load note" }, 500);
  const latest = Array.isArray(data) ? data[0] : null;
  return c.json({ content: latest?.content ?? "", updated_at: latest?.updated_at ?? null });
});

// ----- /journal/note (POST) -----
app.post("/journal/note", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const cardId = typeof payload.card_id === "string" ? payload.card_id : "";
  if (!cardId) {
    console.error("[card-gate] POST /journal/note: missing card_id in payload");
    return c.json({ error: "Invalid session" }, 401);
  }
  console.log("[card-gate] POST /journal/note: card_id (prefix)=", cardId.slice(0, 8));
  const ip = getClientIp(c);
  if (!(await rateLimitJournal(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { content?: unknown; place_id?: unknown; idempotency_key?: unknown };
  try {
    body = await c.req.json();
  } catch (e) {
    console.error("[card-gate] POST /journal/note: JSON parse error", e);
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const content = typeof body?.content === "string" ? body.content : (body?.content != null ? String(body.content) : "");
  const placeId = typeof body?.place_id === "string" ? body.place_id : "__my_paris__";
  const idempotencyKey = typeof body?.idempotency_key === "string" && body.idempotency_key.length > 0 ? body.idempotency_key : null;
  if (content.length > 10000) return c.json({ error: "Content too long (max 10000 chars)" }, 400);
  console.log("[card-gate] POST /journal/note validate ok", { card_id: cardId.slice(0, 8), place_id: placeId, has_key: !!idempotencyKey, content_len: content.length });
  const now = new Date().toISOString();

  try {
    // Use limit(1) + data[0] instead of maybeSingle(): duplicates on (card_id, place_id) would make maybeSingle() error ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 500.
    console.log("[card-gate] POST /journal/note selecting existing by (card_id, place_id)");
    const { data: existingRows, error: selectErr } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("card_id", cardId)
      .eq("place_id", placeId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (selectErr) {
      console.error("[card-gate] POST /journal/note select failed err=", selectErr.message, "code=", selectErr.code);
      return c.json({ error: "Failed to save note" }, 500);
    }

    const existing = Array.isArray(existingRows) ? existingRows[0] : null;
    if (existing?.id) {
      const { error: uErr } = await supabase
        .from("journal_entries")
        .update({ content, updated_at: now })
        .eq("id", existing.id);
      if (uErr) {
        console.error("[card-gate] POST /journal/note update failed err=", uErr.message, "code=", uErr.code, "details=", (uErr as { details?: string }).details);
        return c.json({ error: "Failed to save note" }, 500);
      }
      return c.json({ ok: true });
    }

    const row: Record<string, unknown> = {
      content,
      place_id: placeId,
      card_id: cardId,
      created_at: now,
      updated_at: now,
    };
    if (idempotencyKey) row.idempotency_key = idempotencyKey;
    const { error: iErr } = await supabase.from("journal_entries").insert(row);
    if (iErr) {
      if (iErr.code === "23505") return c.json({ ok: true });
      console.error("[card-gate] POST /journal/note insert failed err=", iErr.message, "code=", iErr.code, "details=", (iErr as { details?: string }).details, "hint=", (iErr as { hint?: string }).hint);
      return c.json({ error: "Failed to save note" }, 500);
    }
    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[card-gate] POST /journal/note unhandled err stack=", message, stack);
    return c.json({ error: "Failed to save note" }, 500);
  }
});

// ----- /journal/entries (POST) -----
app.post("/journal/entries", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitJournal(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { content: string; place_id: string; idempotency_key?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const { content, place_id, idempotency_key } = body;
  if (!content || typeof place_id !== "string") {
    return c.json({ error: "content and place_id required" }, 400);
  }
  if (content.length > 10000) return c.json({ error: "Content too long (max 10000 chars)" }, 400);
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    content,
    place_id,
    card_id: payload.card_id,
    created_at: now,
    updated_at: now,
  };
  if (typeof idempotency_key === "string" && idempotency_key.length > 0) row.idempotency_key = idempotency_key;
  const { error } = await supabase.from("journal_entries").insert(row);
  if (error) {
    if (error.code === "23505") return c.json({ ok: true });
    return c.json({ error: "Failed to append entry" }, 500);
  }
  return c.json({ ok: true });
});

// ----- /journal/insert -----
app.post("/journal/insert", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitJournal(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { content?: string; place_id?: string; idempotency_key?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const content = (body?.content ?? "").trim();
  const placeId = body?.place_id ?? null;
  const idempotencyKey = typeof body?.idempotency_key === "string" && body.idempotency_key.length > 0 ? body.idempotency_key : null;
  if (!content) return c.json({ error: "Content required" }, 400);
  if (content.length > 10000) return c.json({ error: "Content too long (max 10000 chars)" }, 400);
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    content,
    place_id: placeId,
    card_id: payload.card_id,
    created_at: now,
    updated_at: now,
  };
  if (idempotencyKey) row.idempotency_key = idempotencyKey;
  const { data, error } = await supabase
    .from("journal_entries")
    .insert(row)
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return c.json({ success: true, entry: null });
    return c.json({ error: "Failed to insert entry" }, 500);
  }
  return c.json({ success: true, entry: data });
});

// ----- /trace/list -----
app.get("/trace/list", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitTrace(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  const questId = c.req.query("quest_id");
  const etapeId = c.req.query("etape_id");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "3", 10) || 3, 10);
  if (!questId || !etapeId) {
    return c.json({ error: "quest_id and etape_id required" }, 400);
  }
  const { data, error } = await supabase
    .from("traces")
    .select("content, card_id, created_at")
    .eq("quest_id", questId)
    .eq("etape_id", etapeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return c.json({ error: "Failed to load traces" }, 500);
  return c.json({ traces: data ?? [] });
});

// ----- /trace/leave -----
app.post("/trace/leave", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitTrace(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { quest_id: string; etape_id: string; content: string; idempotency_key?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const { quest_id, etape_id, content, idempotency_key } = body;
  const trimmed = (content ?? "").trim();
  if (trimmed.length < 3) return c.json({ error: "TOO_SHORT", message: "Trop court. Au moins 3 caractÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨res." }, 400);
  if (trimmed.length > 140) return c.json({ error: "TOO_LONG", message: "Trop long. Maximum 140 caractÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨res." }, 400);
  if (!quest_id || !etape_id) return c.json({ error: "quest_id and etape_id required" }, 400);

  const { count } = await supabase
    .from("traces")
    .select("*", { count: "exact", head: true })
    .eq("card_id", payload.card_id)
    .eq("quest_id", quest_id)
    .eq("etape_id", etape_id);
  if ((count ?? 0) > 0) {
    return c.json({ error: "ALREADY_LEFT_TRACE", message: "Vous avez dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  laissÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© une trace ici." }, 400);
  }

  const row: Record<string, unknown> = {
    card_id: payload.card_id,
    quest_id,
    etape_id,
    content: trimmed,
  };
  if (typeof idempotency_key === "string" && idempotency_key.length > 0) row.idempotency_key = idempotency_key;
  const { error } = await supabase.from("traces").insert(row);
  if (error) {
    if (error.code === "23505") return c.json({ success: true, message: "Trace laissÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e." });
    return c.json({ error: "DB_ERROR", message: "Impossible de laisser une trace." }, 500);
  }
  return c.json({ success: true, message: "Trace laissÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e." });
});

// ----- /trace/check -----
app.get("/trace/check", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitTrace(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  const questId = c.req.query("quest_id");
  const etapeId = c.req.query("etape_id");
  if (!questId || !etapeId) return c.json({ error: "quest_id and etape_id required" }, 400);
  const { count, error } = await supabase
    .from("traces")
    .select("*", { count: "exact", head: true })
    .eq("card_id", payload.card_id)
    .eq("quest_id", questId)
    .eq("etape_id", etapeId);
  if (error) return c.json({ has_left: false });
  return c.json({ has_left: (count ?? 0) > 0 });
});

const PROGRESSION_ARTIFACTS = ["collection", "traces", "walks", "quest_runs"] as const;
type ProgressionArtifact = (typeof PROGRESSION_ARTIFACTS)[number];
type ProgressionWriteEntry = {
  artifact: ProgressionArtifact;
  payload: unknown;
  client_updated_at: string;
  base_version: number;
};
type ProgressionConflictReason = "BASE_VERSION_MISMATCH" | "BASE_VERSION_AHEAD" | "INSERT_RACE";
type ProgressionConflict = {
  artifact: ProgressionArtifact;
  server_updated_at: string;
  server_version: number;
  reason: ProgressionConflictReason;
};
type ProgressionRow = {
  artifact: string;
  payload: unknown;
  updated_at: string | null;
  client_updated_at: string | null;
  version: number | null;
};
type ProgressionItem = {
  payload: unknown;
  updated_at: string;
  client_updated_at: string;
  version: number;
};
function isProgressionArtifact(value: string): value is ProgressionArtifact {
  return (PROGRESSION_ARTIFACTS as readonly string[]).includes(value);
}
function normalizeProgressionUpdatedAt(raw: unknown, fallback: string): string {
  const parsed = typeof raw === "string" ? new Date(raw).getTime() : NaN;
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  const fallbackParsed = new Date(fallback).getTime();
  if (Number.isFinite(fallbackParsed)) return new Date(fallbackParsed).toISOString();
  return new Date().toISOString();
}
function normalizeProgressionVersion(raw: unknown, fallback = 0): number {
  const parsed = typeof raw === "number"
    ? raw
    : (typeof raw === "string" ? Number.parseInt(raw, 10) : Number.NaN);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  return normalized >= 0 ? normalized : fallback;
}
function asProgressionRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}
function progressionDbErrorResponse(error: unknown): { status: number; body: Record<string, unknown> } {
  const record = asProgressionRecord(error);
  const pgCode = typeof record?.code === "string" ? record.code : null;
  const message = typeof record?.message === "string" ? record.message : "Unknown progression storage error";
  const hint = typeof record?.hint === "string" ? record.hint : message;
  const detail = typeof record?.details === "string" ? record.details : null;
  if (pgCode === "42P01") {
    return {
      status: 500,
      body: {
        error: "PROGRESSION_TABLE_MISSING",
        pg_code: pgCode,
        hint,
        ...(detail ? { detail } : {}),
      },
    };
  }
  if (pgCode === "42703" || pgCode === "42883") {
    return {
      status: 500,
      body: {
        error: "PROGRESSION_SCHEMA_MISSING",
        pg_code: pgCode,
        hint,
        ...(detail ? { detail } : {}),
      },
    };
  }
  if (pgCode === "42501") {
    return {
      status: 403,
      body: {
        error: "PROGRESSION_POLICY_DENIED",
        pg_code: pgCode,
        hint,
      },
    };
  }
  return {
    status: 500,
    body: {
      error: "PROGRESSION_DB_ERROR",
      pg_code: pgCode,
      hint,
      ...(detail ? { detail } : {}),
    },
  };
}
function buildProgressionItems(
  rows: ProgressionRow[] | null | undefined,
  fallbackIso: string,
): Record<string, ProgressionItem> {
  const items: Record<string, ProgressionItem> = {};
  (rows ?? []).forEach((row) => {
    const artifact = typeof row.artifact === "string" ? row.artifact : "";
    if (!isProgressionArtifact(artifact)) return;
    const updatedAt = normalizeProgressionUpdatedAt(row.updated_at, fallbackIso);
    const clientUpdatedAt = normalizeProgressionUpdatedAt(row.client_updated_at, updatedAt);
    items[artifact] = {
      payload: row.payload ?? {},
      updated_at: updatedAt,
      client_updated_at: clientUpdatedAt,
      version: normalizeProgressionVersion(row.version, 0),
    };
  });
  return items;
}
async function fetchProgressionRow(
  supabase: ReturnType<typeof createClient>,
  cardId: string,
  artifact: ProgressionArtifact,
): Promise<{ row: ProgressionRow | null; error: unknown | null }> {
  const { data, error } = await supabase
    .from("card_progression_snapshots")
    .select("artifact, payload, updated_at, client_updated_at, version")
    .eq("card_id", cardId)
    .eq("artifact", artifact)
    .maybeSingle();
  if (error) return { row: null, error };
  return { row: (data as ProgressionRow | null) ?? null, error: null };
}
// ----- Progression: GET /progression/state -----
// Card-scoped persistence for collection, traces, walks, and quest runs.
app.get("/progression/state", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  const requestedArtifacts = (c.req.query("artifacts") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is ProgressionArtifact => isProgressionArtifact(value));
  const artifacts = requestedArtifacts.length > 0
    ? requestedArtifacts
    : [...PROGRESSION_ARTIFACTS];
  const { data, error } = await supabase
    .from("card_progression_snapshots")
    .select("artifact, payload, updated_at, client_updated_at, version")
    .eq("card_id", payload.card_id)
    .in("artifact", artifacts as unknown as string[]);
  if (error) {
    console.error("[card-gate] progression/state get:", error);
    const classified = progressionDbErrorResponse(error);
    return c.json(classified.body, classified.status);
  }
  return c.json({
    ok: true,
    card_id: payload.card_id,
    items: buildProgressionItems(data as ProgressionRow[] | null, new Date().toISOString()),
    server_time: new Date().toISOString(),
  });
});
// ----- Progression: POST /progression/state -----
// Conflict rule: server-authoritative compare-and-set by base_version.
app.post("/progression/state", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { entries?: Array<{ artifact?: string; payload?: unknown; client_updated_at?: unknown; base_version?: unknown }>; source?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const rawEntries = Array.isArray(body?.entries) ? body.entries : [];
  if (rawEntries.length === 0) {
    return c.json({ error: "entries[] required" }, 400);
  }
  const nowIso = new Date().toISOString();
  const dedupedEntries = new Map<ProgressionArtifact, ProgressionWriteEntry>();
  rawEntries.forEach((entry) => {
    const artifactRaw = typeof entry?.artifact === "string" ? entry.artifact : "";
    if (!isProgressionArtifact(artifactRaw)) return;
    dedupedEntries.set(artifactRaw, {
      artifact: artifactRaw,
      payload: entry?.payload ?? {},
      client_updated_at: normalizeProgressionUpdatedAt(entry?.client_updated_at, nowIso),
      base_version: normalizeProgressionVersion(entry?.base_version, 0),
    });
  });
  const sanitizedEntries = [...dedupedEntries.values()];
  if (sanitizedEntries.length === 0) {
    return c.json({ error: "No valid progression entries" }, 400);
  }
  const applied: ProgressionArtifact[] = [];
  const conflicts: ProgressionConflict[] = [];
  for (const entry of sanitizedEntries) {
    const nextVersion = entry.base_version + 1;
    const { data: updatedRow, error: updateError } = await supabase
      .from("card_progression_snapshots")
      .update({
        payload: entry.payload,
        updated_at: nowIso,
        client_updated_at: entry.client_updated_at,
        version: nextVersion,
      })
      .eq("card_id", payload.card_id)
      .eq("artifact", entry.artifact)
      .eq("version", entry.base_version)
      .select("artifact, payload, updated_at, client_updated_at, version")
      .maybeSingle();
    if (updateError) {
      console.error("[card-gate] progression/state update:", updateError);
      const classified = progressionDbErrorResponse(updateError);
      return c.json(classified.body, classified.status);
    }
    if (updatedRow) {
      applied.push(entry.artifact);
      continue;
    }
    if (entry.base_version === 0) {
      const { data: insertedRow, error: insertError } = await supabase
        .from("card_progression_snapshots")
        .insert({
          card_id: payload.card_id,
          artifact: entry.artifact,
          payload: entry.payload,
          updated_at: nowIso,
          client_updated_at: entry.client_updated_at,
          version: 1,
        })
        .select("artifact, payload, updated_at, client_updated_at, version")
        .maybeSingle();
      if (insertError) {
        const insertRecord = asProgressionRecord(insertError);
        const insertCode = typeof insertRecord?.code === "string" ? insertRecord.code : "";
        if (insertCode !== "23505") {
          console.error("[card-gate] progression/state insert:", insertError);
          const classified = progressionDbErrorResponse(insertError);
          return c.json(classified.body, classified.status);
        }
      }
      if (insertedRow) {
        applied.push(entry.artifact);
        continue;
      }
    }
    const { row: currentRow, error: currentError } = await fetchProgressionRow(
      supabase,
      payload.card_id,
      entry.artifact,
    );
    if (currentError) {
      console.error("[card-gate] progression/state conflict fetch:", currentError);
      const classified = progressionDbErrorResponse(currentError);
      return c.json(classified.body, classified.status);
    }
    if (currentRow) {
      conflicts.push({
        artifact: entry.artifact,
        server_updated_at: normalizeProgressionUpdatedAt(currentRow.updated_at, nowIso),
        server_version: normalizeProgressionVersion(currentRow.version, 0),
        reason: entry.base_version === 0 ? "INSERT_RACE" : "BASE_VERSION_MISMATCH",
      });
      continue;
    }
    conflicts.push({
      artifact: entry.artifact,
      server_updated_at: nowIso,
      server_version: 0,
      reason: "BASE_VERSION_AHEAD",
    });
  }
  if (conflicts.length > 0) {
    console.warn("[card-gate] progression/state conflict", {
      card_id: payload.card_id,
      source: body?.source ?? null,
      conflicts,
    });
  }
  const artifacts = sanitizedEntries.map((entry) => entry.artifact);
  const { data: finalRows, error: finalError } = await supabase
    .from("card_progression_snapshots")
    .select("artifact, payload, updated_at, client_updated_at, version")
    .eq("card_id", payload.card_id)
    .in("artifact", artifacts as unknown as string[]);
  if (finalError) {
    console.error("[card-gate] progression/state final rows:", finalError);
    const classified = progressionDbErrorResponse(finalError);
    return c.json(classified.body, classified.status);
  }
  return c.json({
    ok: conflicts.length === 0,
    card_id: payload.card_id,
    applied,
    conflicts,
    items: buildProgressionItems(finalRows as ProgressionRow[] | null, nowIso),
    server_time: new Date().toISOString(),
  });
});
// ============ MIROIR: PARIS TIMEZONE HELPERS ============

/** Get today's date in Paris timezone (YYYY-MM-DD) */
function getTodayParisDate(): string {
  const now = new Date();
  const parisTime = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parisTime.find((p) => p.type === "year")?.value ?? "";
  const month = parisTime.find((p) => p.type === "month")?.value ?? "";
  const day = parisTime.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

/** Get MM-DD format from Paris date (for historical anecdotes) */
function getTodayParisMMDD(): string {
  const now = new Date();
  const parisTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const month = parisTime.find((p) => p.type === "month")?.value ?? "";
  const day = parisTime.find((p) => p.type === "day")?.value ?? "";
  return `${month}-${day}`;
}

/** Get last 7 Paris dates (YYYY-MM-DD) */
function getLast7ParisDays(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const parisTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const year = parisTime.find((p) => p.type === "year")?.value ?? "";
    const month = parisTime.find((p) => p.type === "month")?.value ?? "";
    const day = parisTime.find((p) => p.type === "day")?.value ?? "";
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

/** Simple hash for deterministic selection */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ============ MIROIR: SENTENCE POOLS ============

/** BLOC A ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â PremiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨res phrases fondatrices (rare, initiation) */
const BLOC_A_FOUNDATION = [
  "La ville commence par un regard.",
  "Paris n'est pas un lieu. C'est une prÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©sence qui attend.",
  "Chaque pas creuse une mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©moire qui n'existait pas avant.",
  "La pierre garde ce que l'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“il oublie.",
  "On n'habite pas Paris. On s'y laisse habiter.",
  "Le silence des rues est une langue ancienne.",
  "La ville se souvient de ceux qui l'ont traversÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e.",
  "Paris est un miroir qui renvoie ce qu'on lui donne.",
];

/** BLOC B ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â Phrases centrales (quotidiennes) */
const BLOC_B_CORE = [
  "Aujourd'hui, la ville respire autrement.",
  "Le temps s'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©coule diffÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©remment selon les arrondissements.",
  "Chaque coin de rue garde une trace invisible.",
  "La lumiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re change la texture des souvenirs.",
  "Paris se rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨le par fragments, jamais tout ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  fait.",
  "Les pas s'accumulent et crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ent un rythme propre.",
  "La ville murmure des histoires ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  qui sait ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©couter.",
  "Chaque jour ajoute une couche ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  la mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©moire collective.",
  "Les faÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ades racontent ce que les bouches taisent.",
  "Paris existe autant dans l'absence que dans la prÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©sence.",
  "Le regard transforme l'ordinaire en signe.",
  "La ville se construit dans l'espace entre les choses.",
  "Chaque passage laisse une empreinte lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©gÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re.",
  "Paris se donne ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  ceux qui savent attendre.",
  "La mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©moire habite les interstices.",
];

/** BLOC C ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°chos (activitÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©, cooldown) */
const BLOC_C_ECHO = [
  "L'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cho d'un pas rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©sonne dans le vide.",
  "Ce qui fut gravÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©apparaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®t ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  l'improviste.",
  "La trace appelle la trace.",
  "L'activitÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©veille des mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©moires endormies.",
  "Chaque action crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e un ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cho qui se propage.",
  "Le prÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©sent fait ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cho au passÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©.",
  "L'empreinte appelle sa rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©sonance.",
  "L'activitÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨le ce qui ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©tait cachÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©.",
];

/** Determine kind from sentence (A/B/C) */
function sentenceToKind(sentence: string): "foundation" | "core" | "echo" {
  if (BLOC_A_FOUNDATION.includes(sentence)) return "foundation";
  if (BLOC_C_ECHO.includes(sentence)) return "echo";
  return "core";
}

/** Compute which kind to use today (deterministic rules) */
async function computeKind(
  supabase: ReturnType<typeof createClient>,
  cardId: string
): Promise<"foundation" | "core" | "echo"> {
  const last7Days = getLast7ParisDays();
  
  // Get last 7 days of mirror_daily
  const { data: recent } = await supabase
    .from("mirror_daily")
    .select("sentence, date_paris")
    .eq("card_id", cardId)
    .in("date_paris", last7Days)
    .order("date_paris", { ascending: false });

  const recentSentences = recent?.map((r) => r.sentence) ?? [];
  const recentKinds = recentSentences.map(sentenceToKind);

  // Check for activity (inscriptions in last 7 days)
  const { count: activityCount } = await supabase
    .from("inscriptions")
    .select("*", { count: "exact", head: true })
    .eq("card_id", cardId)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const hasActivity = (activityCount ?? 0) > 0;
  const hasRecentEcho = recentKinds.includes("echo");
  const daysSinceLastEcho = recentKinds.indexOf("echo");

  // Rule: C (echo) if activity AND no echo in last 2 days
  if (hasActivity && (!hasRecentEcho || daysSinceLastEcho >= 2)) {
    return "echo";
  }

  // Rule: A (foundation) if no entries in last 7 days (rare/initiation)
  if (recentSentences.length === 0) {
    return "foundation";
  }

  // Default: B (core)
  return "core";
}

// ============ MIROIR: HISTORICAL ANECDOTES ============

/** Historical anecdotes keyed by MM-DD (subset from histoire-quotidienne.ts) */
const HISTORICAL_ANECDOTES: Record<string, string> = {
  "11-06": "Ce matin-lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â , dans un atelier proche du Louvre, les ouvriers dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©montent une faÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ade promise ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  disparaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®tre. Les plans ont changÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©. La ville s'aligne. Paris ne sait pas encore qu'elle est en train de devenir une capitale moderne.\n\nRue ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©troite, pierre froide, silence administratif.\n\nAujourd'hui encore, le tracÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© subsiste.",
  "11-07": "L'Exposition Universelle vient de fermer ses portes. Le Champ-de-Mars retrouve son silence. Les pavillons vides rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©sonnent encore des voix du monde entier. Un gardien ramasse un programme froissÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©.\n\nParis apprend qu'elle peut ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âªtre internationale sans cesser d'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âªtre elle-mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âªme.",
  "11-08": "Le Louvre ouvre comme musÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e public pour la premiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re fois. Les toiles de maÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®tres, autrefois rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©servÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es au regard royal, sont maintenant offertes ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  tous. Un menuisier entre, hÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©site, lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ve les yeux.\n\nLa beautÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© n'a plus de porte fermÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e.",
  "11-09": "On inaugure la premiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re ligne de chemin de fer partant de Paris vers Rouen. La gare Saint-Lazare vibre d'une ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©nergie nouvelle. Les voyageurs ne savent pas encore que le temps vient de changer d'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©chelle.\n\nLa ville devient un point de dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©part, pas seulement une destination.",
  "11-10": "Dans un cafÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© de Montparnasse, un groupe d'artistes amÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ricains discute jusqu'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  l'aube. Hemingway commande un autre verre. Paris est devenue l'exil choisi, le refuge crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©atif.\n\nLa ville accueille ceux qui cherchent leur propre voix.",
  "11-11": "Pour la premiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re fois, Paris dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©pose un soldat inconnu sous l'Arc de Triomphe. La flamme n'est pas encore allumÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e. Le silence est total.\n\nLa mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©moire collective trouve son ancrage gÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©omÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©trique au centre de l'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°toile.",
  "11-12": "On pose la premiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re pierre du Palais du Luxembourg, commandÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© par Marie de MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dicis. Elle veut recrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©er Florence ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Paris. L'architecte dessine des jardins qui respirent.\n\nLe pouvoir politique cherche sa traduction vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©gÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©tale.",
  "11-13": "Dans les premiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨res semaines de la RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©volution, les passages couverts deviennent des lieux de dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©bat improvisÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©. On y discute, on y conspire, on y espÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re. L'architecture crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e des zones grises entre public et privÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©.\n\nLa ville trouve de nouveaux espaces de parole.",
  "11-14": "La premiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re ligne de mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©tro parisien ouvre entre Porte de Vincennes et Porte Maillot. Les passagers dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©couvrent un monde souterrain qui transforme la perception de la distance.\n\nLa ville se replie sur elle-mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âªme pour mieux se dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ployer.",
  "11-15": "Les Halles dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©nagent. Le ventre de Paris quitte le centre. Les pavillons Baltard sont promis ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  la dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©molition. Un dernier marchÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© se tient dans l'ombre des structures de fer.\n\nLa ville change de corps sans perdre son ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢me.",
  "02-09": "Aujourd'hui, la ville respire autrement. Chaque coin de rue garde une trace invisible. La lumiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨re change la texture des souvenirs.",
  "02-10": "Paris se rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨le par fragments, jamais tout ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  fait. Les pas s'accumulent et crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ent un rythme propre. La ville murmure des histoires ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  qui sait ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©couter.",
};

/** Get historical anecdote for today (from histoire-quotidienne.ts data) */
function getHistoricalAnecdote(): string | null {
  const mmdd = getTodayParisMMDD();
  return HISTORICAL_ANECDOTES[mmdd] ?? null;
}

// ============ MIROIR ENDPOINTS ============

// ----- GET /mirror/today -----
app.get("/mirror/today", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitJournal(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }

  const cardId = payload.card_id;
  const todayParis = getTodayParisDate();

  // Check cache (existing entry for today)
  const { data: existing } = await supabase
    .from("mirror_daily")
    .select("sentence, anecdote, date_paris")
    .eq("card_id", cardId)
    .eq("date_paris", todayParis)
    .maybeSingle();

  if (existing) {
    // Cache hit: return existing with computed kind
    return c.json({
      date: existing.date_paris,
      sentence: existing.sentence,
      anecdote: existing.anecdote ?? null,
      kind: sentenceToKind(existing.sentence),
    });
  }

  // Cache miss: compute kind and select sentence
  const kind = await computeKind(supabase, cardId);
  const pool = kind === "foundation" ? BLOC_A_FOUNDATION : kind === "echo" ? BLOC_C_ECHO : BLOC_B_CORE;

  // Get recent sentences to avoid immediate repeats
  const last7Days = getLast7ParisDays();
  const { data: recent } = await supabase
    .from("mirror_daily")
    .select("sentence")
    .eq("card_id", cardId)
    .in("date_paris", last7Days)
    .order("date_paris", { ascending: false })
    .limit(7);

  const recentSentences = new Set(recent?.map((r) => r.sentence) ?? []);
  const available = pool.filter((s) => !recentSentences.has(s));
  const candidates = available.length > 0 ? available : pool;

  // Deterministic selection based on cardId + date
  const seed = `${cardId}:${todayParis}`;
  const index = simpleHash(seed) % candidates.length;
  const selectedSentence = candidates[index];

  // Get historical anecdote
  const anecdote = getHistoricalAnecdote();

  // Save to cache
  await supabase.from("mirror_daily").insert({
    card_id: cardId,
    date_paris: todayParis,
    sentence: selectedSentence,
    anecdote: anecdote,
  });

  return c.json({
    date: todayParis,
    sentence: selectedSentence,
    anecdote: anecdote,
    kind: kind,
  });
});

// ----- GET /mirror/kept -----
app.get("/mirror/kept", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitJournal(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }

  const { data, error } = await supabase
    .from("kept_sentences")
    .select("id, sentence, created_at")
    .eq("card_id", payload.card_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[card-gate] mirror/kept:", error);
    return c.json({ error: "Failed to load kept sentences" }, 500);
  }

  return c.json({ items: data ?? [] });
});

// ----- POST /mirror/keep -----
app.post("/mirror/keep", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitJournal(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }

  let body: { sentence?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const sentence = body?.sentence?.trim();
  if (!sentence || sentence.length === 0) {
    return c.json({ error: "sentence required" }, 400);
  }

  const { error: insertError } = await supabase.from("kept_sentences").insert({
    card_id: payload.card_id,
    sentence: sentence,
  });

  if (insertError) {
    console.error("[card-gate] mirror/keep:", insertError);
    return c.json({ error: "Failed to keep sentence" }, 500);
  }

  return c.json({ ok: true });
});

// ----- Map: POST /inscriptions -----
const RUE_HEURE_REGEX = /^Rue\s+.+\s*[ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â\-]\s*\d{1,2}:\d{2}/i;
function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}
app.post("/inscriptions", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { kind?: string; arrondissement?: number; anchor_id?: string; text?: string; idempotency_key?: string; opt_in_field?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const kind = body?.kind ?? "arrondissement";
  if (!["arrondissement", "quest", "lieu"].includes(kind)) {
    return c.json({ error: "Invalid kind" }, 400);
  }
  const text = normalizeLegacyText(String(body?.text ?? ""));
  if (text.length < 10) return c.json({ error: "Text too short" }, 400);
  const words = wordCount(text);
  if (words < 80 || words > 120) {
    return c.json({ error: "Doit contenir entre 80 et 120 mots." }, 400);
  }
  if (!RUE_HEURE_REGEX.test(text)) {
    return c.json({ error: "Le texte doit commencer par ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â« Rue ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â HH:MM ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»." }, 400);
  }
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    card_id: payload.card_id,
    kind,
    status: "pending",
    arrondissement: typeof body?.arrondissement === "number" ? body.arrondissement : null,
    anchor_id: typeof body?.anchor_id === "string" ? body.anchor_id : null,
    text,
    opt_in_field: typeof body?.opt_in_field === "boolean" ? body.opt_in_field : false,
    created_at: now,
  };
  if (typeof body?.idempotency_key === "string" && body.idempotency_key.length > 0) {
    row.idempotency_key = body.idempotency_key;
  }
  const { data, error } = await supabase.from("inscriptions").insert(row).select("id, created_at").single();
  if (error) {
    if (error.code === "23505") return c.json({ ok: true, id: null });
    return c.json({ error: "Failed to create inscription" }, 500);
  }
  return c.json({ ok: true, id: data?.id, created_at: data?.created_at });
});

// ----- Map: POST /proofs/meridiens -----
app.post("/proofs/meridiens", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { meridian_id?: string; approx?: { lat: number; lng: number; radius_m: number }; answer?: string; personal_sentence?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const meridian_id = body?.meridian_id;
  const approx = body?.approx;
  if (!meridian_id || typeof meridian_id !== "string" || !approx || typeof approx.lat !== "number" || typeof approx.lng !== "number" || typeof approx.radius_m !== "number") {
    return c.json({ error: "meridian_id and approx (lat, lng, radius_m) required" }, 400);
  }
  if (approx.radius_m < 80 || approx.radius_m > 200) {
    return c.json({ error: "radius_m must be between 80 and 200" }, 400);
  }
  const answer = (body?.answer ?? "").trim();
  const personal_sentence = (body?.personal_sentence ?? "").trim();
  if (answer.length < 1 || personal_sentence.length < 3) {
    return c.json({ error: "answer and personal_sentence required" }, 400);
  }
  const now = new Date().toISOString();
  const { data: proof, error: proofErr } = await supabase
    .from("meridian_proofs")
    .insert({
      card_id: payload.card_id,
      meridian_id,
      approx_lat: approx.lat,
      approx_lng: approx.lng,
      radius_m: approx.radius_m,
      answer,
      personal_sentence,
      created_at: now,
      status: "pending",
    })
    .select("id, created_at")
    .single();
  if (proofErr) return c.json({ error: "Failed to create proof" }, 500);
  const { error: segErr } = await supabase.from("engraved_segments").insert({
    card_id: payload.card_id,
    kind: "meridien",
    status: "pending",
    from_lat: approx.lat,
    from_lng: approx.lng,
    to_lat: approx.lat,
    to_lng: approx.lng,
    created_at: now,
  });
  if (segErr) console.error("[card-gate] segment insert:", segErr);
  return c.json({ ok: true, id: proof?.id, created_at: proof?.created_at });
});

// ----- Map: POST /proofs/marches -----
app.post("/proofs/marches", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { link_or_text?: string; from?: { arrondissement?: number; lat?: number; lng?: number }; to?: { arrondissement?: number; lat?: number; lng?: number } };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const now = new Date().toISOString();
  const fromPoint = body?.from ?? {};
  const toPoint = body?.to ?? {};
  const { error: segErr } = await supabase.from("engraved_segments").insert({
    card_id: payload.card_id,
    kind: "marche",
    status: "pending",
    from_arrondissement: fromPoint.arrondissement ?? null,
    from_lat: fromPoint.lat ?? null,
    from_lng: fromPoint.lng ?? null,
    to_arrondissement: toPoint.arrondissement ?? null,
    to_lat: toPoint.lat ?? null,
    to_lng: toPoint.lng ?? null,
    created_at: now,
  });
  if (segErr) return c.json({ error: "Failed to create segment" }, 500);
  return c.json({ ok: true });
});

// ----- Map: POST /segments -----
app.post("/segments", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { kind?: string; from?: Record<string, unknown>; to?: Record<string, unknown>; idempotency_key?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const kind = body?.kind ?? "marche";
  if (!["marche", "meridien", "tresor"].includes(kind)) {
    return c.json({ error: "Invalid kind" }, 400);
  }
  const from = body?.from ?? {};
  const to = body?.to ?? {};
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    card_id: payload.card_id,
    kind,
    status: "pending",
    from_arrondissement: from.arrondissement ?? null,
    from_anchor_id: from.anchor_id ?? null,
    from_lat: from.lat ?? null,
    from_lng: from.lng ?? null,
    to_arrondissement: to.arrondissement ?? null,
    to_anchor_id: to.anchor_id ?? null,
    to_lat: to.lat ?? null,
    to_lng: to.lng ?? null,
    created_at: now,
  };
  if (typeof body?.idempotency_key === "string" && body.idempotency_key.length > 0) {
    row.idempotency_key = body.idempotency_key;
  }
  const { error } = await supabase.from("engraved_segments").insert(row);
  if (error) {
    if (error.code === "23505") return c.json({ ok: true });
    return c.json({ error: "Failed to create segment" }, 500);
  }
  return c.json({ ok: true });
});

// ----- Map: GET /zone-progress -----
// Card-scoped progress surface for proxy parity.
app.get("/zone-progress", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }

  const cardId = payload.card_id;
  const [inscriptionsRes, segmentsRes, proofsRes] = await Promise.all([
    supabase
      .from("inscriptions")
      .select("arrondissement, created_at")
      .eq("card_id", cardId)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("engraved_segments")
      .select("from_arrondissement, to_arrondissement, created_at")
      .eq("card_id", cardId)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("meridian_proofs")
      .select("created_at")
      .eq("card_id", cardId)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const zoneMap = new Map<number, { zone_id: string; entered_at: string | null; engraved: boolean; engraved_at: string | null }>();
  const ensure = (arr: number) => {
    if (!zoneMap.has(arr)) {
      zoneMap.set(arr, {
        zone_id: `paris-${arr}`,
        entered_at: null,
        engraved: false,
        engraved_at: null,
      });
    }
    return zoneMap.get(arr)!;
  };

  for (const ins of inscriptionsRes.data ?? []) {
    const arr = ins.arrondissement as number | null;
    if (typeof arr !== "number" || arr < 1 || arr > 20) continue;
    const z = ensure(arr);
    z.engraved = true;
    if (!z.engraved_at || (ins.created_at && ins.created_at > z.engraved_at)) z.engraved_at = ins.created_at ?? null;
    if (!z.entered_at || (ins.created_at && ins.created_at > z.entered_at)) z.entered_at = ins.created_at ?? null;
  }

  for (const seg of segmentsRes.data ?? []) {
    const candidates = [seg.from_arrondissement, seg.to_arrondissement];
    for (const raw of candidates) {
      const arr = raw as number | null;
      if (typeof arr !== "number" || arr < 1 || arr > 20) continue;
      const z = ensure(arr);
      if (!z.entered_at || (seg.created_at && seg.created_at > z.entered_at)) z.entered_at = seg.created_at ?? null;
    }
  }

  const zones = Array.from(zoneMap.values()).map((z) => ({
    zone_id: z.zone_id,
    entered: z.entered_at != null,
    entered_at: z.entered_at,
    presence_ritual: false,
    presence_ritual_at: null,
    observation_ritual: false,
    observation_ritual_at: null,
    engraved: z.engraved,
    engraved_at: z.engraved_at,
    is_custodian: false,
    custodian_since: null,
    custody_expires_at: null,
    objectives_complete: z.engraved ? 2 : (z.entered_at ? 1 : 0),
    updated_at: z.engraved_at ?? z.entered_at ?? new Date().toISOString(),
  }));

  return c.json({
    ok: true,
    zones,
    stats: {
      total_zones_touched: zones.length,
      total_objectives: zones.reduce((sum, z) => sum + (z.objectives_complete ?? 0), 0),
      zones_complete: 0,
      total_rituals: (proofsRes.data ?? []).length,
      total_engravings: zones.filter((z) => z.engraved).length,
      custodianships: 0,
    },
    complexion: {
      presence_points: 0,
      wisdom_points: 0,
      shadow_points: 0,
      completed_rituals_count: (proofsRes.data ?? []).length,
      revealed: zones.length > 0,
    },
  });
});

// ----- Map: GET /map-state -----
app.get("/map-state", async (c) => {
  const supabase = getSupabase();
  const payload = await requireOptionalJwt(c);
  const cacheKey = payload ? `map-state:card:${payload.card_id}` : "map-state:public";
  const cached = readMapCache<Record<string, unknown>>(cacheKey);
  if (cached) {
    c.header("Cache-Control", payload ? MAP_CACHE_CONTROL_PRIVATE : MAP_CACHE_CONTROL_PUBLIC);
    if (payload) c.header("Vary", "X-ARCHE-CARD-CODE, Authorization");
    return c.json(cached);
  }
  const ip = getClientIp(c);
  const allowed = payload
    ? await rateLimitMap(supabase, payload.card_id, ip)
    : await rateLimitMapPublic(supabase, ip);
  if (!allowed) {
    return c.json({ error: "Too many requests" }, 429);
  }
  if (!payload) {
    // Public onboarding-safe response: no personal traces without card context.
    const body = {
      inscriptions: [],
      segments: [],
      meridian_proofs: [],
    };
    writeMapCache(cacheKey, body);
    c.header("Cache-Control", MAP_CACHE_CONTROL_PUBLIC);
    return c.json(body);
  }
  const cardId = payload.card_id;
  const [inscriptionsRes, segmentsRes, proofsRes] = await Promise.all([
    supabase.from("inscriptions").select("id, kind, status, arrondissement, anchor_id, text, created_at").eq("card_id", cardId).order("created_at", { ascending: false }),
    supabase.from("engraved_segments").select("id, kind, status, from_arrondissement, from_anchor_id, from_lat, from_lng, to_arrondissement, to_anchor_id, to_lat, to_lng, created_at").eq("card_id", cardId).order("created_at", { ascending: false }),
    supabase.from("meridian_proofs").select("id, meridian_id, approx_lat, approx_lng, radius_m, answer, personal_sentence, created_at, status").eq("card_id", cardId).order("created_at", { ascending: false }),
  ]);
  const inscriptions = inscriptionsRes.data ?? [];
  const segments = segmentsRes.data ?? [];
  const meridian_proofs = proofsRes.data ?? [];
  const body = {
    inscriptions: inscriptions.map((i) => ({
      id: i.id,
      kind: i.kind,
      status: i.status,
      arrondissement: i.arrondissement ?? undefined,
      anchorId: i.anchor_id ?? undefined,
      text: i.text,
      createdAt: i.created_at,
    })),
    segments: segments.map((s) => ({
      id: s.id,
      kind: s.kind,
      status: s.status,
      from: { arrondissement: s.from_arrondissement, anchorId: s.from_anchor_id, lat: s.from_lat, lng: s.from_lng },
      to: { arrondissement: s.to_arrondissement, anchorId: s.to_anchor_id, lat: s.to_lat, lng: s.to_lng },
      createdAt: s.created_at,
    })),
    meridian_proofs: meridian_proofs.map((p) => ({
      id: p.id,
      meridianId: p.meridian_id,
      approx: { lat: p.approx_lat, lng: p.approx_lng, radiusM: p.radius_m },
      answer: p.answer,
      personalSentence: p.personal_sentence,
      createdAt: p.created_at,
      status: p.status,
    })),
  };
  writeMapCache(cacheKey, body);
  c.header("Cache-Control", MAP_CACHE_CONTROL_PRIVATE);
  c.header("Vary", "X-ARCHE-CARD-CODE, Authorization");
  return c.json(body);
});

// ----- Map: GET /map-state/community -----
// Anonymous-by-design world signals for "La Ville".
// Uses only opt-in inscriptions + aggregated activity; no card_id exposure.
app.get("/map-state/community", async (c) => {
  const supabase = getSupabase();
  const payload = await requireOptionalJwt(c);
  const isPublicRequest = !payload;
  const ip = getClientIp(c);
  const allowed = payload
    ? await rateLimitMap(supabase, payload.card_id, ip)
    : await rateLimitMapPublic(supabase, ip);
  if (!allowed) {
    return c.json({ error: "Too many requests" }, 429);
  }

  const windowDaysRaw = c.req.query("window_days");
  const parsed = Number.parseInt(windowDaysRaw ?? "90", 10);
  const windowDays = Number.isFinite(parsed) ? Math.max(7, Math.min(365, parsed)) : 90;
  const topNRaw = c.req.query("top_n");
  const parsedTop = Number.parseInt(topNRaw ?? "12", 10);
  const topN = Number.isFinite(parsedTop) ? Math.max(1, Math.min(20, parsedTop)) : 12;
  const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const communityCacheKey = `map-state:community:${windowDays}:${topN}`;
  const cached = readMapCache<Record<string, unknown>>(communityCacheKey);
  if (cached) {
    c.header("Cache-Control", MAP_CACHE_CONTROL_PUBLIC);
    return c.json(cached);
  }

  const inscriptionLimit = Math.max(600, topN * 80);
  const segmentLimit = Math.max(900, topN * 120);
  const maxSampleLines = isPublicRequest ? 1 : 2;

  const [inscriptionsRes, segmentsRes] = await Promise.all([
    supabase
      .from("inscriptions")
      .select("arrondissement, status, text, created_at")
      .eq("opt_in_field", true)
      .not("arrondissement", "is", null)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(inscriptionLimit),
    supabase
      .from("engraved_segments")
      .select("from_arrondissement, to_arrondissement, status, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(segmentLimit),
  ]);

  if (inscriptionsRes.error || segmentsRes.error) {
    console.error("[card-gate] community map-state:", inscriptionsRes.error ?? segmentsRes.error);
    return c.json({ error: "Failed to load community signals" }, 500);
  }

  const bucket = new Map<number, {
    inscriptionCount: number;
    verifiedInscriptions: number;
    pendingInscriptions: number;
    segmentCount: number;
    lastActivityAt: string | null;
    sampleLines: string[];
  }>();

  const ensure = (arr: number) => {
    if (!bucket.has(arr)) {
      bucket.set(arr, {
        inscriptionCount: 0,
        verifiedInscriptions: 0,
        pendingInscriptions: 0,
        segmentCount: 0,
        lastActivityAt: null,
        sampleLines: [],
      });
    }
    return bucket.get(arr)!;
  };

  const pushLastActivity = (target: { lastActivityAt: string | null }, iso: string | null) => {
    if (!iso) return;
    if (!target.lastActivityAt || iso > target.lastActivityAt) target.lastActivityAt = iso;
  };

  for (const ins of inscriptionsRes.data ?? []) {
    const arr = ins.arrondissement as number | null;
    if (typeof arr !== "number" || arr < 1 || arr > 20) continue;
    const b = ensure(arr);
    b.inscriptionCount += 1;
    if (ins.status === "verified") b.verifiedInscriptions += 1;
    else b.pendingInscriptions += 1;
    pushLastActivity(b, ins.created_at ?? null);
    if (b.sampleLines.length < maxSampleLines && typeof ins.text === "string") {
      const clean = normalizeLegacyText(ins.text);
      b.sampleLines.push(clean.slice(0, 96));
    }
  }

  for (const seg of segmentsRes.data ?? []) {
    const from = seg.from_arrondissement as number | null;
    const to = seg.to_arrondissement as number | null;
    const targets = [from, to].filter((v): v is number => typeof v === "number" && v >= 1 && v <= 20);
    for (const arr of targets) {
      const b = ensure(arr);
      b.segmentCount += 1;
      pushLastActivity(b, seg.created_at ?? null);
    }
  }

  const allArrondissements = Array.from(bucket.entries())
    .map(([arrondissement, value]) => {
      const weighted =
        value.verifiedInscriptions * 1 +
        value.pendingInscriptions * 0.5 +
        value.segmentCount * 0.35;
      const signalStrength = Math.max(0, Math.min(1, weighted / 24));
      return {
        arrondissement,
        signalStrength,
        inscriptionCount: value.inscriptionCount,
        verifiedInscriptions: value.verifiedInscriptions,
        pendingInscriptions: value.pendingInscriptions,
        segmentCount: value.segmentCount,
        lastActivityAt: value.lastActivityAt,
        sampleLines: value.sampleLines,
      };
    })
    .sort((a, b) => b.signalStrength - a.signalStrength);
  const arrondissements = allArrondissements.slice(0, topN);

  const body = {
    generated_at: new Date().toISOString(),
    window_days: windowDays,
    total_active_arrondissements: allArrondissements.length,
    top_n: topN,
    arrondissements,
  };
  writeMapCache(communityCacheKey, body);
  c.header("Cache-Control", MAP_CACHE_CONTROL_PUBLIC);
  return c.json(body);
});

// ============ CHURCH QUESTS + AURA ============

const CHURCH_QUEST_DEFS: Record<string, { onsite_code: string; duration_sec: number; questions: { id: string; prompt: string; type: string; choices?: string[]; answer: string | string[]; points: number }[]; rewards: { aura_xp: number; seals: string[]; status_unlock?: string } }> = {
  stlouis_ihs: {
    onsite_code: "IHS",
    duration_sec: 210,
    questions: [
      { id: "q1", prompt: "Entre les trois lettres sur le triangle.", type: "text", answer: "IHS", points: 1 },
      { id: "q2", prompt: "Ce triangle signifie surtout :", type: "mcq", choices: ["TrinitÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©", "Royalty", "Ordre militaire"], answer: "TrinitÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©", points: 1 },
      { id: "q3", prompt: "Sur la plaque : quel jour / mois / annÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e ?", type: "text", answer: "10 MARS 1805", points: 1 },
    ],
    rewards: { aura_xp: 10, seals: ["IHS"], status_unlock: "Lecteur de signes" },
  },
  st_sulpice_seuil: {
    onsite_code: "MERIDIEN",
    duration_sec: 210,
    questions: [
      { id: "q1", prompt: "Entre le mot trouvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© sur place.", type: "text", answer: "MERIDIEN", points: 1 },
      { id: "q2", prompt: "Cette ligne sert ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  :", type: "mcq", choices: ["Mesurer le temps", "DÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©finir le nord", "Marquer le mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ridien"], answer: "Marquer le mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ridien", points: 1 },
      { id: "q3", prompt: "En une phrase : qu'as-tu observÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© ?", type: "text", answer: "*", points: 1 },
    ],
    rewards: { aura_xp: 12, seals: ["SEUIL"], status_unlock: "Habitant du seuil" },
  },
};

function normaliseAnswer(s: string): string {
  return s.replace(/\s+/g, " ").trim().toUpperCase();
}

function checkAnswer(userAnswer: string, correct: string | string[]): boolean {
  const u = normaliseAnswer(userAnswer);
  if (Array.isArray(correct)) return correct.some((c) => normaliseAnswer(c) === u);
  if (correct === "*") return u.length > 0;
  return normaliseAnswer(correct) === u;
}

async function rateLimitQuest(supabase: ReturnType<typeof createClient>, cardId: string, ip: string): Promise<boolean> {
  const k1 = `quest:${cardId}`;
  const k2 = `quest_ip:${ip}`;
  return (await dbRateLimit(supabase, k1, 30, 3600)) && (await dbRateLimit(supabase, k2, 100, 3600));
}

app.post("/quest/start", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitQuest(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  let body: { questId: string; onsiteCode?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const { questId, onsiteCode } = body;
  if (!questId) return c.json({ error: "questId required" }, 400);
  const def = CHURCH_QUEST_DEFS[questId];
  if (!def) return c.json({ error: "Unknown quest" }, 400);
  const code = (onsiteCode ?? "").replace(/\s+/g, "").toUpperCase();
  if (code !== def.onsite_code.toUpperCase()) return c.json({ error: "Code incorrect" }, 400);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + def.duration_sec * 1000);
  const { data: run, error } = await supabase
    .from("church_quest_runs")
    .insert({
      card_id: payload.card_id,
      quest_id: questId,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      state: "running",
      answers: {},
    })
    .select("id, expires_at")
    .single();
  if (error) {
    console.error("[card-gate] quest/start insert:", error);
    return c.json({ error: "Failed to start quest" }, 500);
  }
  const questions = def.questions.map((q) => ({ id: q.id, prompt: q.prompt, type: q.type, choices: q.choices }));
  return c.json({ runId: run.id, expiresAt: run.expires_at, questions });
});

app.post("/quest/answer", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitQuest(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  let body: { runId: string; questionId: string; answer: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const { runId, questionId, answer } = body;
  if (!runId || !questionId) return c.json({ error: "runId and questionId required" }, 400);
  const { data: run, error: fetchErr } = await supabase
    .from("church_quest_runs")
    .select("id, expires_at, answers, card_id, state")
    .eq("id", runId)
    .eq("card_id", payload.card_id)
    .single();
  if (fetchErr || !run) return c.json({ error: "Run not found" }, 404);
  if ((run as { state?: string }).state !== "running") return c.json({ error: "Run not active" }, 400);
  if (new Date(run.expires_at) < new Date()) return c.json({ error: "Run expired" }, 400);
  const answers = (run.answers as Record<string, string>) ?? {};
  answers[questionId] = answer ?? "";
  const { error: updateErr } = await supabase.from("church_quest_runs").update({ answers }).eq("id", runId).eq("card_id", payload.card_id);
  if (updateErr) return c.json({ error: "Failed to save answer" }, 500);
  const remainingSec = Math.max(0, Math.floor((new Date(run.expires_at).getTime() - Date.now()) / 1000));
  return c.json({ ok: true, remainingSec });
});

app.post("/quest/complete", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitQuest(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  let body: { runId: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const { runId } = body;
  if (!runId) return c.json({ error: "runId required" }, 400);
  const { data: run, error: fetchErr } = await supabase
    .from("church_quest_runs")
    .select("id, quest_id, expires_at, answers, card_id")
    .eq("id", runId)
    .eq("card_id", payload.card_id)
    .single();
  if (fetchErr || !run) return c.json({ error: "Run not found" }, 404);
  if (run.state !== "running") return c.json({ error: "Run already completed" }, 400);
  const def = CHURCH_QUEST_DEFS[run.quest_id];
  if (!def) return c.json({ error: "Unknown quest" }, 500);
  const now = new Date();
  const expired = new Date(run.expires_at) < now;
  const answers = (run.answers as Record<string, string>) ?? {};
  let score = 0;
  for (const q of def.questions) {
    const userAns = answers[q.id];
    if (checkAnswer(userAns ?? "", q.answer)) score += q.points;
  }
  const earnedSeal = !expired && score >= def.questions.length;
  const { error: updateRunErr } = await supabase
    .from("church_quest_runs")
    .update({
      state: "completed",
      completed_at: now.toISOString(),
      score,
      earned_seal: earnedSeal,
    })
    .eq("id", runId)
    .eq("card_id", payload.card_id);
  if (updateRunErr) return c.json({ error: "Failed to complete run" }, 500);

  const { data: profile } = await supabase.from("aura_profiles").select("*").eq("card_id", payload.card_id).single();
  const seals: string[] = Array.isArray(profile?.seals) ? profile.seals : [];
  if (earnedSeal && def.rewards.seals?.[0]) seals.push(def.rewards.seals[0]);
  const addPoints = expired ? 0 : def.rewards.aura_xp;
  const newPoints = (profile?.aura_points ?? 0) + addPoints;
  const { data: completedRuns } = await supabase.from("church_quest_runs").select("id, earned_seal").eq("card_id", payload.card_id).eq("state", "completed");
  const totalSeals = (completedRuns ?? []).filter((r) => r.earned_seal).length;
  let newStatus = profile?.status ?? "Quiet";
  if (newPoints > 0) newStatus = "Marcheur";
  if (totalSeals >= 1) newStatus = "Lecteur de signes";
  if (totalSeals >= 3) newStatus = "Habitant du seuil";
  if (totalSeals >= 7) newStatus = "Gardien discret";
  const { error: upsertErr } = await supabase.from("aura_profiles").upsert(
    {
      card_id: payload.card_id,
      aura_level: Math.min(3, Math.floor(newPoints / 30)),
      aura_points: newPoints,
      status: newStatus,
      last_quest_at: now.toISOString(),
      seals,
    },
    { onConflict: "card_id" }
  );
  if (upsertErr) console.error("[card-gate] aura_profiles upsert:", upsertErr);
  return c.json({ score, earnedSeal, newStatus, auraPointsTotal: newPoints });
});

app.get("/aura/profile", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  const { data, error } = await supabase.from("aura_profiles").select("aura_level, aura_points, status, last_quest_at, seals").eq("card_id", payload.card_id).single();
  if (error && error.code !== "PGRST116") {
    console.error("[card-gate] aura/profile:", error);
    return c.json({ error: "Failed to load profile" }, 500);
  }
  return c.json({
    auraLevel: data?.aura_level ?? 0,
    auraPoints: data?.aura_points ?? 0,
    status: data?.status ?? "Quiet",
    lastQuestAt: data?.last_quest_at ?? undefined,
    seals: Array.isArray(data?.seals) ? data.seals : [],
  });
});

// ============ PARIS TIMEZONE HELPERS ============

const PARIS_TZ = "Europe/Paris";


function getParisDateFromIso(iso: string): string {
  const date = new Date(iso);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}


function daysBetweenParisDates(parisDateA: string, parisDateB: string): number {
  const a = new Date(parisDateA + "T00:00:00+01:00");
  const b = new Date(parisDateB + "T00:00:00+01:00");
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}


// ============ MIROIR SENTENCE POOLS ============


// ============ MIROIR ENDPOINTS ============

// ----- Miroir: GET /mirror/today -----
app.get("/mirror/today", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  const cardId = payload.card_id;
  const todayParis = getTodayParisDate();
  const todayMMDD = getTodayParisMMDD();

  // Check cache
  const { data: cached } = await supabase
    .from("mirror_daily")
    .select("sentence, anecdote, date")
    .eq("card_id", cardId)
    .eq("date", todayParis)
    .single();

  if (cached) {
    // Cache hit: return cached sentence with kind derived from sentence
    return c.json({
      date: cached.date,
      sentence: cached.sentence,
      anecdote: cached.anecdote,
      kind: sentenceToKind(cached.sentence),
    });
  }

  // Cache miss: compute kind and select sentence
  const last7ParisDays = getLast7ParisDays();
  const sevenDaysAgoUtc = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch inscriptions for activity signals
  const { data: inscriptions } = await supabase
    .from("inscriptions")
    .select("created_at, arrondissement")
    .eq("card_id", cardId)
    .gte("created_at", sevenDaysAgoUtc)
    .order("created_at", { ascending: false });

  const inscriptionsList = inscriptions ?? [];

  // Activity signals
  const inscriptionsToday = inscriptionsList.filter(
    (i) => getParisDateFromIso(i.created_at) === todayParis
  ).length;
  const activeDays7 = new Set(
    inscriptionsList.map((i) => getParisDateFromIso(i.created_at))
  ).size;
  const lastActivity = inscriptionsList[0]?.created_at;
  const daysSinceLastActivity = lastActivity
    ? daysBetweenParisDates(getParisDateFromIso(lastActivity), todayParis)
    : 999;
  const totalArrondissements = new Set(
    inscriptionsList.map((i) => i.arrondissement).filter((a) => a != null)
  ).size;

  // Compute raw kind (before cooldown)
  function computeKind(): "foundation" | "core" | "echo" {
    // Foundation: rare cases (initiation/return after 7+ days absence)
    if (daysSinceLastActivity >= 7 || inscriptionsList.length === 0) {
      return "foundation";
    }

    // Echo: triggered by activity
    const hasActivity = inscriptionsToday > 0 || activeDays7 >= 3 || totalArrondissements >= 2;
    if (hasActivity) {
      return "echo";
    }

    // Default: core
    return "core";
  }

  const rawKind = computeKind();

  // Apply echo cooldown: no echo in last 3 days, max 2 in previous 6 days
  let finalKind = rawKind;
  if (rawKind === "echo") {
    // Recompute kinds for past 7 days to check cooldown
    const pastKinds: ("foundation" | "core" | "echo")[] = [];
    for (let i = 1; i <= 6; i++) {
      const pastDate = last7ParisDays[i];
      const { data: pastCached } = await supabase
        .from("mirror_daily")
        .select("sentence")
        .eq("card_id", cardId)
        .eq("date", pastDate)
        .single();
      if (pastCached) {
        pastKinds.push(sentenceToKind(pastCached.sentence));
      }
    }

    // Check cooldown: no echo in last 3 days
    const last3DaysHaveEcho = pastKinds.slice(0, 3).some((k) => k === "echo");
    // Max 2 echoes in previous 6 days
    const echoCount6Days = pastKinds.filter((k) => k === "echo").length;

    if (last3DaysHaveEcho || echoCount6Days >= 2) {
      finalKind = "core"; // Downgrade to core if cooldown active
    }
  }

  // Select sentence from appropriate pool
  const pool = finalKind === "foundation" ? BLOC_A_FOUNDATION : finalKind === "echo" ? BLOC_C_ECHO : BLOC_B_CORE;
  
  // Avoid repeating yesterday's sentence
  const { data: yesterdayCached } = await supabase
    .from("mirror_daily")
    .select("sentence")
    .eq("card_id", cardId)
    .eq("date", last7ParisDays[1])
    .single();
  const yesterdaySentence = yesterdayCached?.sentence;

  let selectedSentence: string;
  if (pool.length === 1) {
    selectedSentence = pool[0];
  } else {
    // Deterministic selection using hash
    const seed = `${cardId}:${todayParis}:${finalKind}`;
    let attempts = 0;
    do {
      const hash = simpleHash(`${seed}:${attempts}`);
      selectedSentence = pool[hash % pool.length];
      attempts++;
    } while (selectedSentence === yesterdaySentence && attempts < 10);
  }

  // Get anecdote (if available)
  const anecdotes: Record<string, string> = {
    // Add anecdotes here keyed by MM-DD format
    // Example: "01-15": "Ce jour-lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Paris: ..."
  };
  const anecdote = anecdotes[todayMMDD] ?? null;

  // Save to cache
  await supabase.from("mirror_daily").insert({
    card_id: cardId,
    date: todayParis,
    sentence: selectedSentence,
    anecdote,
  });

  return c.json({
    date: todayParis,
    sentence: selectedSentence,
    anecdote,
    kind: finalKind,
  });
});

// ----- Miroir: GET /mirror/kept -----
app.get("/mirror/kept", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  const cardId = payload.card_id;

  const { data: items, error } = await supabase
    .from("kept_sentences")
    .select("id, text, created_at")
    .eq("card_id", cardId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[card-gate] mirror kept:", error);
    return c.json({ error: "Failed to load kept sentences" }, 500);
  }

  return c.json({
    items: (items ?? []).map((item) => ({
      id: item.id,
      text: item.text,
      createdAt: item.created_at,
    })),
  });
});

// ----- Miroir: POST /mirror/keep -----
app.post("/mirror/keep", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  let body: { sentence?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const sentence = (body?.sentence ?? "").trim();
  if (sentence.length < 3) {
    return c.json({ error: "sentence required (min 3 chars)" }, 400);
  }
  const cardId = payload.card_id;
  const now = new Date().toISOString();

  const { error } = await supabase.from("kept_sentences").insert({
    card_id: cardId,
    text: sentence,
    created_at: now,
  });

  if (error) {
    console.error("[card-gate] mirror keep:", error);
    return c.json({ error: "Failed to keep sentence" }, 500);
  }

  return c.json({ ok: true });
});

// ----- Champ: GET /champ/items -----
app.get("/champ/items", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
  }
  const todayParis = getTodayParisDate();
  const last7ParisDays = getLast7ParisDays();
  const sevenDaysAgoParis = last7ParisDays[6];
  const sevenDaysAgoUtc = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inscriptionsRows, error } = await supabase
    .from("inscriptions")
    .select("id, arrondissement, text, created_at")
    .eq("opt_in_field", true)
    .gte("created_at", sevenDaysAgoUtc)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[card-gate] champ items:", error);
    return c.json({ error: "Failed to load champ items" }, 500);
  }

  const last7ParisDaysSet = new Set(last7ParisDays);
  const items = (inscriptionsRows ?? [])
    .filter((row) => {
      const parisDate = getParisDateFromIso(row.created_at);
      return last7ParisDaysSet.has(parisDate);
    })
    .slice(0, 50)
    .map((row) => {
    const parisDate = getParisDateFromIso(row.created_at);
    const daysDiff = daysBetweenParisDates(parisDate, todayParis);
    let timeLabel: string;
    if (daysDiff === 0) {
      timeLabel = "aujourd'hui";
    } else if (daysDiff === 1) {
      timeLabel = "hier";
    } else {
      timeLabel = `il y a ${daysDiff} jours`;
    }

    // Full text for display (not truncated)
    const fullText = normalizeLegacyText(String(row.text ?? ""));
    
    // Excerpt for map dots (truncated)
    let textExcerpt = fullText;
    if (textExcerpt.length > 90) {
      textExcerpt = textExcerpt.slice(0, 87).trim() + "...";
    }

    return {
      id: row.id,
      arrondissement: row.arrondissement,
      textExcerpt,
      textFull: fullText, // Full text for modal display
      timeLabel,
      created_at: row.created_at,
    };
  });

  return c.json({ items });
});

// ----- Champs (Creator Engine) -----
const CHAMP_LAYER_KEYS = ["trace", "alignment", "cadence", "echo", "threshold"] as const;
function validateChampLayers(layers: unknown): layers is Record<string, number> {
  if (!layers || typeof layers !== "object") return false;
  const o = layers as Record<string, unknown>;
  for (const k of CHAMP_LAYER_KEYS) {
    if (!(k in o)) return false;
    const v = o[k];
    if (typeof v !== "number" || v < 0 || v > 1) return false;
  }
  return true;
}

app.get("/champs/active", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  const champIdParam = c.req.query("champ_id")?.trim() || null;
  if (champIdParam) {
    const { data: champ, error } = await supabase.from("champs").select("*").eq("id", champIdParam).maybeSingle();
    if (error) return c.json({ error: "Failed to load champ" }, 500);
    if (!champ) return c.json({ error: "Champ not found" }, 404);
    const canRead = champ.created_by === payload.card_id || (champ.status === "live" && ["unlisted", "public"].includes(champ.visibility));
    if (!canRead) return c.json({ error: "Forbidden" }, 403);
    return c.json(champ);
  }
  const { data: defaultRow } = await supabase.from("card_default_champ").select("champ_id").eq("card_id", payload.card_id).maybeSingle();
  if (!defaultRow?.champ_id) return c.json({ active: null });
  const { data: champ, error } = await supabase.from("champs").select("*").eq("id", defaultRow.champ_id).maybeSingle();
  if (error || !champ) return c.json({ active: null });
  const canRead = champ.created_by === payload.card_id || (champ.status === "live" && ["unlisted", "public"].includes(champ.visibility));
  if (!canRead) return c.json({ active: null });
  return c.json({ active: champ });
});

app.get("/champs", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  const mine = c.req.query("mine") !== "0";
  const statusQ = c.req.query("status")?.trim();
  const visibilityQ = c.req.query("visibility")?.trim();
  const limitRaw = parseInt(c.req.query("limit") ?? "20", 10);
  const offsetRaw = parseInt(c.req.query("offset") ?? "0", 10);
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));
  const offset = Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0);
  let q = supabase.from("champs").select("id, name, layers, tone, active_start_minute, active_end_minute, timezone, zone, status, visibility, created_by, created_at, updated_at").order("updated_at", { ascending: false });
  if (mine) q = q.eq("created_by", payload.card_id);
  else {
    q = q.eq("status", "live");
    if (visibilityQ) q = q.eq("visibility", visibilityQ);
  }
  if (statusQ) q = q.eq("status", statusQ);
  const { data, error } = await q.range(offset, offset + limit - 1);
  if (error) return c.json({ error: "Failed to list champs" }, 500);
  return c.json({ champs: data ?? [] });
});

app.get("/champs/:id", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  const id = c.req.param("id");
  const { data: champ, error } = await supabase.from("champs").select("*").eq("id", id).maybeSingle();
  if (error) return c.json({ error: "Failed to load champ" }, 500);
  if (!champ) return c.json({ error: "Champ not found" }, 404);
  const canRead = champ.created_by === payload.card_id || (champ.status === "live" && ["unlisted", "public"].includes(champ.visibility));
  if (!canRead) return c.json({ error: "Forbidden" }, 403);
  return c.json(champ);
});

app.post("/champs", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  let body: { name?: string; layers?: unknown; tone?: string; active_start_minute?: number; active_end_minute?: number; timezone?: string; zone?: unknown; status?: string; visibility?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "Sans titre";
  if (!validateChampLayers(body?.layers)) return c.json({ error: "layers must have trace, alignment, cadence, echo, threshold (0..1)" }, 400);
  const layers = body.layers as Record<string, number>;
  const tone = typeof body?.tone === "string" && body.tone.trim() ? body.tone.trim() : "whisper";
  const active_start_minute = typeof body?.active_start_minute === "number" && body.active_start_minute >= 0 && body.active_start_minute <= 1439 ? Math.floor(body.active_start_minute) : 1050;
  const active_end_minute = typeof body?.active_end_minute === "number" && body.active_end_minute >= 0 && body.active_end_minute <= 1439 ? Math.floor(body.active_end_minute) : 1380;
  const timezone = typeof body?.timezone === "string" && body.timezone.trim() ? body.timezone.trim() : "Europe/Paris";
  const zone = body?.zone && typeof body.zone === "object" ? body.zone : {};
  const status = body?.status === "live" || body?.status === "archived" ? body.status : "draft";
  const visibility = body?.visibility === "unlisted" || body?.visibility === "public" ? body.visibility : "private";
  const row = { name, layers, tone, active_start_minute, active_end_minute, timezone, zone, status, visibility, created_by: payload.card_id };
  const { data, error } = await supabase.from("champs").insert(row).select().single();
  if (error) {
    console.error("[card-gate] champs insert:", error);
    return c.json({ error: "Failed to create champ" }, 500);
  }
  return c.json(data);
});

app.patch("/champs/:id", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  const id = c.req.param("id");
  const { data: existing, error: fetchErr } = await supabase.from("champs").select("id, created_by").eq("id", id).maybeSingle();
  if (fetchErr || !existing) return c.json({ error: "Champ not found" }, 404);
  if (existing.created_by !== payload.card_id) return c.json({ error: "Forbidden" }, 403);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const updates: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (validateChampLayers(body?.layers)) updates.layers = body.layers;
  if (typeof body?.tone === "string") updates.tone = body.tone.trim() || "whisper";
  if (typeof body?.active_start_minute === "number" && body.active_start_minute >= 0 && body.active_start_minute <= 1439) updates.active_start_minute = Math.floor(body.active_start_minute);
  if (typeof body?.active_end_minute === "number" && body.active_end_minute >= 0 && body.active_end_minute <= 1439) updates.active_end_minute = Math.floor(body.active_end_minute);
  if (typeof body?.timezone === "string") updates.timezone = body.timezone.trim() || "Europe/Paris";
  if (body?.zone && typeof body.zone === "object") updates.zone = body.zone;
  if (body?.status === "draft" || body?.status === "live" || body?.status === "archived") updates.status = body.status;
  if (body?.visibility === "private" || body?.visibility === "unlisted" || body?.visibility === "public") updates.visibility = body.visibility;
  if (Object.keys(updates).length === 0) {
    const { data } = await supabase.from("champs").select("*").eq("id", id).single();
    return c.json(data);
  }
  const { data, error } = await supabase.from("champs").update(updates).eq("id", id).eq("created_by", payload.card_id).select().single();
  if (error) return c.json({ error: "Failed to update champ" }, 500);
  return c.json(data);
});

app.delete("/champs/:id", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  const id = c.req.param("id");
  const { data: existing, error: fetchErr } = await supabase.from("champs").select("id, created_by").eq("id", id).maybeSingle();
  if (fetchErr || !existing) return c.json({ error: "Champ not found" }, 404);
  if (existing.created_by !== payload.card_id) return c.json({ error: "Forbidden" }, 403);
  const { error } = await supabase.from("champs").delete().eq("id", id);
  if (error) return c.json({ error: "Failed to delete champ" }, 500);
  return c.json({ ok: true });
});

app.post("/champs/:id/activate", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) return c.json({ error: "Too many requests" }, 429);
  const id = c.req.param("id");
  let body: { set_default?: boolean };
  try {
    body = await c.req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  const { data: champ, error: fetchErr } = await supabase.from("champs").select("id, created_by, status, visibility").eq("id", id).maybeSingle();
  if (fetchErr || !champ) return c.json({ error: "Champ not found" }, 404);
  const canRead = champ.created_by === payload.card_id || (champ.status === "live" && ["unlisted", "public"].includes(champ.visibility));
  if (!canRead) return c.json({ error: "Forbidden" }, 403);
  if (body?.set_default) {
    await supabase.from("card_default_champ").upsert({ card_id: payload.card_id, champ_id: id, updated_at: new Date().toISOString() }, { onConflict: "card_id" });
  }
  return c.json({ active: champ });
});

// 404 catch-all: log path for debugging routing (e.g. champs/active 404)
app.all("*", (c) => {
  const pathname = (() => {
    try {
      return new URL(c.req.url).pathname;
    } catch {
      return c.req.path;
    }
  })();
  console.error("[card-gate] 404 not found path=", pathname, "method=", c.req.method, "url=", c.req.url);
  return c.json({ error: "Not found", path: pathname }, 404);
});

// Wrap so we always send CORS with exact origin (never *) ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â Supabase or Hono may add * otherwise
function corsHeadersFromRequest(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? undefined;
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-ARCHE-CARD-CODE, X-ARCHE-SESSION, apikey",
    "Access-Control-Allow-Credentials": "true",
  };
  // CRITICAL: Never use '*' when credentials are included. Always use specific origin or omit.
  if (origin && isOriginAllowed(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
  }
  // If origin not allowed, don't set Access-Control-Allow-Origin at all (will fail CORS, which is correct)
  return h;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") ?? undefined;
  const debugId = globalThis.crypto.randomUUID().slice(0, 8);

  console.log(`[DEBUG-${debugId}] Incoming request: ${req.method} ${req.url}`);
  console.log(`[DEBUG-${debugId}] Origin header: ${origin}`);
  console.log(`[DEBUG-${debugId}] isOriginAllowed: ${isOriginAllowed(origin)}`);

  try {
    // Handle preflight OPTIONS requests FIRST - before Hono can interfere
    if (req.method === "OPTIONS") {
      const headers = new Headers();
      setCorsHeaders(headers, origin);
      headers.set("X-Debug-Id", debugId); // For tracing

      // LOG CRITICAL: Verify that '*' is NOT in headers
      const acao = headers.get("Access-Control-Allow-Origin");
      if (acao === "*") {
        console.error(`[DEBUG-${debugId}] BUG DETECTED: '*' was set somehow!`);
      }

      console.log(`[DEBUG-${debugId}] OPTIONS response headers:`, JSON.stringify(Object.fromEntries(headers)));

      return new Response(null, { 
        status: 204, 
        headers: headers,
      });
    }

    // Handle actual requests
    const normalizedReq = normalizeCardGateRequestPath(req);
    const res = await app.fetch(normalizedReq);

    // Create completely new Headers object to avoid any defaults
    const newHeaders = new Headers();

    // Copy all non-CORS headers from response
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Skip any existing CORS headers - we'll set our own
      if (!lowerKey.startsWith("access-control-")) {
        newHeaders.set(key, value);
      }
    });

    // Set proper CORS headers explicitly
    setCorsHeaders(newHeaders, origin);

    // Verify no wildcard was set
    const finalAcao = newHeaders.get("Access-Control-Allow-Origin");
    if (finalAcao === "*") {
      console.error(`[DEBUG-${debugId}] BUG DETECTED: '*' was set in final headers!`);
    }

    console.log(`[DEBUG-${debugId}] Request response - Origin: ${origin}, ACAO: ${finalAcao ?? "(not set)"}`);

    return new Response(res.body, { 
      status: res.status, 
      statusText: res.statusText, 
      headers: newHeaders 
    });

  } catch (error) {
    // CRITICAL: Handle errors with proper CORS headers (prevents Supabase from adding '*')
    console.error(`[DEBUG-${debugId}] Error:`, error);

    const errorHeaders = new Headers();
    errorHeaders.set("Content-Type", JSON_UTF8);
    setCorsHeaders(errorHeaders, origin);

    // Verify no wildcard in error response
    const errorAcao = errorHeaders.get("Access-Control-Allow-Origin");
    if (errorAcao === "*") {
      console.error(`[DEBUG-${debugId}] BUG DETECTED: '*' was set in error headers!`);
    }

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: errorHeaders }
    );
  }
});


