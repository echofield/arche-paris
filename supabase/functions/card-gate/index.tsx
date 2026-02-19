/**
 * ARCHÃ‰ â€” Card Gate Edge Function (V1)
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

const app = new Hono().basePath("/card-gate");

// Allowed origins only (no random site can use visitor's browser as relay).
// Browsers send punycode in Origin (e.g. www.xn--arch-paris-e7a.com for www.archÃ©-paris.com).
const ALLOWED_ORIGINS = [
  "https://arche-paris.com",
  "https://www.arche-paris.com",
  "https://xn--arch-paris-e7a.com",
  "https://www.xn--arch-paris-e7a.com",
];
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
    errorHeaders.set("Content-Type", "application/json");
    setCorsHeaders(errorHeaders, origin); // Set CORS for error response too
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: errorHeaders,
    });
  }
  await next();
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
      "Content-Type": "application/json",
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
      "Content-Type": "application/json",
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
          message: "Session expirÃ©e. Utilisez votre mot de passe pour dÃ©connecter."
        }), {
          status: 401,
          headers: {
            ...getCorsHeaders(c),
            "Content-Type": "application/json",
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
        "Content-Type": "application/json",
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
        "Content-Type": "application/json",
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
      "Content-Type": "application/json",
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
      "Content-Type": "application/json",
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
      "Content-Type": "application/json",
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
  return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
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

const LAW_VERSION = "2026-02-19.1";
const WORLD_VERSION = "2026-02-19.1";
const PROTECTED_INTENTS = new Set(["ritual.start"]);
const PRESENCE_PULSE_COOLDOWN_MS = 30_000;
const PRESENCE_PULSE_WINDOW_MINUTES = 20;
const PRESENCE_PULSE_MIN_FOR_RITUAL = 3;
const WHISPER_MIN_PRESENCE = 6;
const WHISPER_ROTATION_MINUTES = 15;
const WHISPER_COOLDOWN_MINUTES = 10;

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
    location_hint: "Panthéon",
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

function computeZoneWhisper(zoneH3: string, presenceRecent: number, nowMs: number): string | null {
  const anchors = anchorsForZone(zoneH3);
  const minPresence = Math.max(
    WHISPER_MIN_PRESENCE,
    anchors
      .map((a) => a.constraints?.presence?.min_pulses_20m ?? 0)
      .reduce((max, v) => Math.max(max, v), 0)
  );
  if (presenceRecent < minPresence) return null;
  const cooldownBucket = Math.floor(nowMs / (WHISPER_COOLDOWN_MINUTES * 60 * 1000));
  const cooldownPhase = (cooldownBucket + (stableZoneSeed(zoneH3) % 2)) % 2;
  if (cooldownPhase === 1) return null;

  const anchorPool = anchors.flatMap((a) => WHISPERS_BY_ANCHOR_TYPE[a.type] ?? []);
  const pool = [...(ZONE_WHISPERS[zoneH3] ?? []), ...anchorPool, ...DEFAULT_WHISPERS];
  if (!pool.length) return null;
  const rotationBucket = Math.floor(nowMs / (WHISPER_ROTATION_MINUTES * 60 * 1000));
  const idx = rotationBucket % pool.length;
  return pool[idx] ?? null;
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
  const worldChampItems: Array<{ id: string; ts: string; h3: string; excerpt: string }> = [];
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
      const text = (row.text ?? "").trim().replace(/\s+/g, " ");
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
        const whisper = computeZoneWhisper(zone.h3, presenceRecent, nowMs);
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
    .limit(1)
    .maybeSingle();
  if (error) return c.json({ error: "Failed to load note" }, 500);
  return c.json({ content: data?.content ?? "", updated_at: data?.updated_at ?? null });
});

// ----- /journal/note (POST) -----
app.post("/journal/note", async (c) => {
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
  const content = body?.content ?? "";
  const placeId = body?.place_id ?? "__my_paris__";
  const idempotencyKey = typeof body?.idempotency_key === "string" && body.idempotency_key.length > 0 ? body.idempotency_key : null;
  if (content.length > 10000) return c.json({ error: "Content too long (max 10000 chars)" }, 400);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("card_id", payload.card_id)
    .eq("place_id", placeId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error: uErr } = await supabase
      .from("journal_entries")
      .update({ content, updated_at: now })
      .eq("id", existing.id);
    if (uErr) return c.json({ error: "Failed to save note" }, 500);
  } else {
    const row: Record<string, unknown> = {
      content,
      place_id: placeId,
      card_id: payload.card_id,
      created_at: now,
      updated_at: now,
    };
    if (idempotencyKey) row.idempotency_key = idempotencyKey;
    const { error: iErr } = await supabase.from("journal_entries").insert(row);
    if (iErr) {
      if (iErr.code === "23505") return c.json({ ok: true });
      return c.json({ error: "Failed to save note" }, 500);
    }
  }
  return c.json({ ok: true });
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
  if (trimmed.length < 3) return c.json({ error: "TOO_SHORT", message: "Trop court. Au moins 3 caractÃ¨res." }, 400);
  if (trimmed.length > 140) return c.json({ error: "TOO_LONG", message: "Trop long. Maximum 140 caractÃ¨res." }, 400);
  if (!quest_id || !etape_id) return c.json({ error: "quest_id and etape_id required" }, 400);

  const { count } = await supabase
    .from("traces")
    .select("*", { count: "exact", head: true })
    .eq("card_id", payload.card_id)
    .eq("quest_id", quest_id)
    .eq("etape_id", etape_id);
  if ((count ?? 0) > 0) {
    return c.json({ error: "ALREADY_LEFT_TRACE", message: "Vous avez dÃ©jÃ  laissÃ© une trace ici." }, 400);
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
    if (error.code === "23505") return c.json({ success: true, message: "Trace laissÃ©e." });
    return c.json({ error: "DB_ERROR", message: "Impossible de laisser une trace." }, 500);
  }
  return c.json({ success: true, message: "Trace laissÃ©e." });
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

/** BLOC A â€” PremiÃ¨res phrases fondatrices (rare, initiation) */
const BLOC_A_FOUNDATION = [
  "La ville commence par un regard.",
  "Paris n'est pas un lieu. C'est une prÃ©sence qui attend.",
  "Chaque pas creuse une mÃ©moire qui n'existait pas avant.",
  "La pierre garde ce que l'Å“il oublie.",
  "On n'habite pas Paris. On s'y laisse habiter.",
  "Le silence des rues est une langue ancienne.",
  "La ville se souvient de ceux qui l'ont traversÃ©e.",
  "Paris est un miroir qui renvoie ce qu'on lui donne.",
];

/** BLOC B â€” Phrases centrales (quotidiennes) */
const BLOC_B_CORE = [
  "Aujourd'hui, la ville respire autrement.",
  "Le temps s'Ã©coule diffÃ©remment selon les arrondissements.",
  "Chaque coin de rue garde une trace invisible.",
  "La lumiÃ¨re change la texture des souvenirs.",
  "Paris se rÃ©vÃ¨le par fragments, jamais tout Ã  fait.",
  "Les pas s'accumulent et crÃ©ent un rythme propre.",
  "La ville murmure des histoires Ã  qui sait Ã©couter.",
  "Chaque jour ajoute une couche Ã  la mÃ©moire collective.",
  "Les faÃ§ades racontent ce que les bouches taisent.",
  "Paris existe autant dans l'absence que dans la prÃ©sence.",
  "Le regard transforme l'ordinaire en signe.",
  "La ville se construit dans l'espace entre les choses.",
  "Chaque passage laisse une empreinte lÃ©gÃ¨re.",
  "Paris se donne Ã  ceux qui savent attendre.",
  "La mÃ©moire habite les interstices.",
];

/** BLOC C â€” Ã‰chos (activitÃ©, cooldown) */
const BLOC_C_ECHO = [
  "L'Ã©cho d'un pas rÃ©sonne dans le vide.",
  "Ce qui fut gravÃ© rÃ©apparaÃ®t Ã  l'improviste.",
  "La trace appelle la trace.",
  "L'activitÃ© rÃ©veille des mÃ©moires endormies.",
  "Chaque action crÃ©e un Ã©cho qui se propage.",
  "Le prÃ©sent fait Ã©cho au passÃ©.",
  "L'empreinte appelle sa rÃ©sonance.",
  "L'activitÃ© rÃ©vÃ¨le ce qui Ã©tait cachÃ©.",
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
  "11-06": "Ce matin-lÃ , dans un atelier proche du Louvre, les ouvriers dÃ©montent une faÃ§ade promise Ã  disparaÃ®tre. Les plans ont changÃ©. La ville s'aligne. Paris ne sait pas encore qu'elle est en train de devenir une capitale moderne.\n\nRue Ã©troite, pierre froide, silence administratif.\n\nAujourd'hui encore, le tracÃ© subsiste.",
  "11-07": "L'Exposition Universelle vient de fermer ses portes. Le Champ-de-Mars retrouve son silence. Les pavillons vides rÃ©sonnent encore des voix du monde entier. Un gardien ramasse un programme froissÃ©.\n\nParis apprend qu'elle peut Ãªtre internationale sans cesser d'Ãªtre elle-mÃªme.",
  "11-08": "Le Louvre ouvre comme musÃ©e public pour la premiÃ¨re fois. Les toiles de maÃ®tres, autrefois rÃ©servÃ©es au regard royal, sont maintenant offertes Ã  tous. Un menuisier entre, hÃ©site, lÃ¨ve les yeux.\n\nLa beautÃ© n'a plus de porte fermÃ©e.",
  "11-09": "On inaugure la premiÃ¨re ligne de chemin de fer partant de Paris vers Rouen. La gare Saint-Lazare vibre d'une Ã©nergie nouvelle. Les voyageurs ne savent pas encore que le temps vient de changer d'Ã©chelle.\n\nLa ville devient un point de dÃ©part, pas seulement une destination.",
  "11-10": "Dans un cafÃ© de Montparnasse, un groupe d'artistes amÃ©ricains discute jusqu'Ã  l'aube. Hemingway commande un autre verre. Paris est devenue l'exil choisi, le refuge crÃ©atif.\n\nLa ville accueille ceux qui cherchent leur propre voix.",
  "11-11": "Pour la premiÃ¨re fois, Paris dÃ©pose un soldat inconnu sous l'Arc de Triomphe. La flamme n'est pas encore allumÃ©e. Le silence est total.\n\nLa mÃ©moire collective trouve son ancrage gÃ©omÃ©trique au centre de l'Ã‰toile.",
  "11-12": "On pose la premiÃ¨re pierre du Palais du Luxembourg, commandÃ© par Marie de MÃ©dicis. Elle veut recrÃ©er Florence Ã  Paris. L'architecte dessine des jardins qui respirent.\n\nLe pouvoir politique cherche sa traduction vÃ©gÃ©tale.",
  "11-13": "Dans les premiÃ¨res semaines de la RÃ©volution, les passages couverts deviennent des lieux de dÃ©bat improvisÃ©. On y discute, on y conspire, on y espÃ¨re. L'architecture crÃ©e des zones grises entre public et privÃ©.\n\nLa ville trouve de nouveaux espaces de parole.",
  "11-14": "La premiÃ¨re ligne de mÃ©tro parisien ouvre entre Porte de Vincennes et Porte Maillot. Les passagers dÃ©couvrent un monde souterrain qui transforme la perception de la distance.\n\nLa ville se replie sur elle-mÃªme pour mieux se dÃ©ployer.",
  "11-15": "Les Halles dÃ©mÃ©nagent. Le ventre de Paris quitte le centre. Les pavillons Baltard sont promis Ã  la dÃ©molition. Un dernier marchÃ© se tient dans l'ombre des structures de fer.\n\nLa ville change de corps sans perdre son Ã¢me.",
  "02-09": "Aujourd'hui, la ville respire autrement. Chaque coin de rue garde une trace invisible. La lumiÃ¨re change la texture des souvenirs.",
  "02-10": "Paris se rÃ©vÃ¨le par fragments, jamais tout Ã  fait. Les pas s'accumulent et crÃ©ent un rythme propre. La ville murmure des histoires Ã  qui sait Ã©couter.",
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
const RUE_HEURE_REGEX = /^Rue\s+.+\s*[â€”\-]\s*\d{1,2}:\d{2}/i;
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
  const text = (body?.text ?? "").trim();
  if (text.length < 10) return c.json({ error: "Text too short" }, 400);
  const words = wordCount(text);
  if (words < 80 || words > 120) {
    return c.json({ error: "Doit contenir entre 80 et 120 mots." }, 400);
  }
  if (!RUE_HEURE_REGEX.test(text)) {
    return c.json({ error: "Le texte doit commencer par Â« Rue â€¦ â€” HH:MM Â»." }, 400);
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
      b.sampleLines.push(ins.text.slice(0, 96));
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
      { id: "q2", prompt: "Ce triangle signifie surtout :", type: "mcq", choices: ["TrinitÃ©", "Royalty", "Ordre militaire"], answer: "TrinitÃ©", points: 1 },
      { id: "q3", prompt: "Sur la plaque : quel jour / mois / annÃ©e ?", type: "text", answer: "10 MARS 1805", points: 1 },
    ],
    rewards: { aura_xp: 10, seals: ["IHS"], status_unlock: "Lecteur de signes" },
  },
  st_sulpice_seuil: {
    onsite_code: "MERIDIEN",
    duration_sec: 210,
    questions: [
      { id: "q1", prompt: "Entre le mot trouvÃ© sur place.", type: "text", answer: "MERIDIEN", points: 1 },
      { id: "q2", prompt: "Cette ligne sert Ã  :", type: "mcq", choices: ["Mesurer le temps", "DÃ©finir le nord", "Marquer le mÃ©ridien"], answer: "Marquer le mÃ©ridien", points: 1 },
      { id: "q3", prompt: "En une phrase : qu'as-tu observÃ© ?", type: "text", answer: "*", points: 1 },
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
    // Example: "01-15": "Ce jour-lÃ  Ã  Paris: ..."
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
    const fullText = row.text.trim().replace(/\s+/g, " ");
    
    // Excerpt for map dots (truncated)
    let textExcerpt = fullText;
    if (textExcerpt.length > 90) {
      textExcerpt = textExcerpt.slice(0, 87).trim() + "â€¦";
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

// Wrap so we always send CORS with exact origin (never *) â€” Supabase or Hono may add * otherwise
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
    const res = await app.fetch(req);

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
    errorHeaders.set("Content-Type", "application/json");
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
