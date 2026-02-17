/**
 * ARCHÉ — Card Gate Edge Function (V1)
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
// Browsers send punycode in Origin (e.g. www.xn--arch-paris-e7a.com for www.arché-paris.com).
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
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, apikey");
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
    return c.json({ error: "Already paired", code: "ALREADY_PAIRED" }, 409);
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
          message: "Session expirée. Utilisez votre mot de passe pour déconnecter."
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
async function requireJwt(c: { req: { header: (n: string) => string | undefined } }): Promise<{ card_id: string } | Response> {
  const auth = c.req.header("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const cors = getCorsHeaders(c);
  if (!token) return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  const payload = await verifyToken(token);
  if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  return payload;
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
  if (trimmed.length < 3) return c.json({ error: "TOO_SHORT", message: "Trop court. Au moins 3 caractères." }, 400);
  if (trimmed.length > 140) return c.json({ error: "TOO_LONG", message: "Trop long. Maximum 140 caractères." }, 400);
  if (!quest_id || !etape_id) return c.json({ error: "quest_id and etape_id required" }, 400);

  const { count } = await supabase
    .from("traces")
    .select("*", { count: "exact", head: true })
    .eq("card_id", payload.card_id)
    .eq("quest_id", quest_id)
    .eq("etape_id", etape_id);
  if ((count ?? 0) > 0) {
    return c.json({ error: "ALREADY_LEFT_TRACE", message: "Vous avez déjà laissé une trace ici." }, 400);
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
    if (error.code === "23505") return c.json({ success: true, message: "Trace laissée." });
    return c.json({ error: "DB_ERROR", message: "Impossible de laisser une trace." }, 500);
  }
  return c.json({ success: true, message: "Trace laissée." });
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

/** BLOC A — Premières phrases fondatrices (rare, initiation) */
const BLOC_A_FOUNDATION = [
  "La ville commence par un regard.",
  "Paris n'est pas un lieu. C'est une présence qui attend.",
  "Chaque pas creuse une mémoire qui n'existait pas avant.",
  "La pierre garde ce que l'œil oublie.",
  "On n'habite pas Paris. On s'y laisse habiter.",
  "Le silence des rues est une langue ancienne.",
  "La ville se souvient de ceux qui l'ont traversée.",
  "Paris est un miroir qui renvoie ce qu'on lui donne.",
];

/** BLOC B — Phrases centrales (quotidiennes) */
const BLOC_B_CORE = [
  "Aujourd'hui, la ville respire autrement.",
  "Le temps s'écoule différemment selon les arrondissements.",
  "Chaque coin de rue garde une trace invisible.",
  "La lumière change la texture des souvenirs.",
  "Paris se révèle par fragments, jamais tout à fait.",
  "Les pas s'accumulent et créent un rythme propre.",
  "La ville murmure des histoires à qui sait écouter.",
  "Chaque jour ajoute une couche à la mémoire collective.",
  "Les façades racontent ce que les bouches taisent.",
  "Paris existe autant dans l'absence que dans la présence.",
  "Le regard transforme l'ordinaire en signe.",
  "La ville se construit dans l'espace entre les choses.",
  "Chaque passage laisse une empreinte légère.",
  "Paris se donne à ceux qui savent attendre.",
  "La mémoire habite les interstices.",
];

/** BLOC C — Échos (activité, cooldown) */
const BLOC_C_ECHO = [
  "L'écho d'un pas résonne dans le vide.",
  "Ce qui fut gravé réapparaît à l'improviste.",
  "La trace appelle la trace.",
  "L'activité réveille des mémoires endormies.",
  "Chaque action crée un écho qui se propage.",
  "Le présent fait écho au passé.",
  "L'empreinte appelle sa résonance.",
  "L'activité révèle ce qui était caché.",
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
  "11-06": "Ce matin-là, dans un atelier proche du Louvre, les ouvriers démontent une façade promise à disparaître. Les plans ont changé. La ville s'aligne. Paris ne sait pas encore qu'elle est en train de devenir une capitale moderne.\n\nRue étroite, pierre froide, silence administratif.\n\nAujourd'hui encore, le tracé subsiste.",
  "11-07": "L'Exposition Universelle vient de fermer ses portes. Le Champ-de-Mars retrouve son silence. Les pavillons vides résonnent encore des voix du monde entier. Un gardien ramasse un programme froissé.\n\nParis apprend qu'elle peut être internationale sans cesser d'être elle-même.",
  "11-08": "Le Louvre ouvre comme musée public pour la première fois. Les toiles de maîtres, autrefois réservées au regard royal, sont maintenant offertes à tous. Un menuisier entre, hésite, lève les yeux.\n\nLa beauté n'a plus de porte fermée.",
  "11-09": "On inaugure la première ligne de chemin de fer partant de Paris vers Rouen. La gare Saint-Lazare vibre d'une énergie nouvelle. Les voyageurs ne savent pas encore que le temps vient de changer d'échelle.\n\nLa ville devient un point de départ, pas seulement une destination.",
  "11-10": "Dans un café de Montparnasse, un groupe d'artistes américains discute jusqu'à l'aube. Hemingway commande un autre verre. Paris est devenue l'exil choisi, le refuge créatif.\n\nLa ville accueille ceux qui cherchent leur propre voix.",
  "11-11": "Pour la première fois, Paris dépose un soldat inconnu sous l'Arc de Triomphe. La flamme n'est pas encore allumée. Le silence est total.\n\nLa mémoire collective trouve son ancrage géométrique au centre de l'Étoile.",
  "11-12": "On pose la première pierre du Palais du Luxembourg, commandé par Marie de Médicis. Elle veut recréer Florence à Paris. L'architecte dessine des jardins qui respirent.\n\nLe pouvoir politique cherche sa traduction végétale.",
  "11-13": "Dans les premières semaines de la Révolution, les passages couverts deviennent des lieux de débat improvisé. On y discute, on y conspire, on y espère. L'architecture crée des zones grises entre public et privé.\n\nLa ville trouve de nouveaux espaces de parole.",
  "11-14": "La première ligne de métro parisien ouvre entre Porte de Vincennes et Porte Maillot. Les passagers découvrent un monde souterrain qui transforme la perception de la distance.\n\nLa ville se replie sur elle-même pour mieux se déployer.",
  "11-15": "Les Halles déménagent. Le ventre de Paris quitte le centre. Les pavillons Baltard sont promis à la démolition. Un dernier marché se tient dans l'ombre des structures de fer.\n\nLa ville change de corps sans perdre son âme.",
  "02-09": "Aujourd'hui, la ville respire autrement. Chaque coin de rue garde une trace invisible. La lumière change la texture des souvenirs.",
  "02-10": "Paris se révèle par fragments, jamais tout à fait. Les pas s'accumulent et créent un rythme propre. La ville murmure des histoires à qui sait écouter.",
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
const RUE_HEURE_REGEX = /^Rue\s+.+\s*[—\-]\s*\d{1,2}:\d{2}/i;
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
    return c.json({ error: "Le texte doit commencer par « Rue … — HH:MM »." }, 400);
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

// ----- Map: GET /map-state -----
app.get("/map-state", async (c) => {
  const supabase = getSupabase();
  const payload = await requireJwt(c);
  if (payload instanceof Response) return payload;
  const ip = getClientIp(c);
  if (!(await rateLimitMap(supabase, payload.card_id, ip))) {
    return c.json({ error: "Too many requests" }, 429);
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
  return c.json({
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
  });
});

// ============ CHURCH QUESTS + AURA ============

const CHURCH_QUEST_DEFS: Record<string, { onsite_code: string; duration_sec: number; questions: { id: string; prompt: string; type: string; choices?: string[]; answer: string | string[]; points: number }[]; rewards: { aura_xp: number; seals: string[]; status_unlock?: string } }> = {
  stlouis_ihs: {
    onsite_code: "IHS",
    duration_sec: 210,
    questions: [
      { id: "q1", prompt: "Entre les trois lettres sur le triangle.", type: "text", answer: "IHS", points: 1 },
      { id: "q2", prompt: "Ce triangle signifie surtout :", type: "mcq", choices: ["Trinité", "Royalty", "Ordre militaire"], answer: "Trinité", points: 1 },
      { id: "q3", prompt: "Sur la plaque : quel jour / mois / année ?", type: "text", answer: "10 MARS 1805", points: 1 },
    ],
    rewards: { aura_xp: 10, seals: ["IHS"], status_unlock: "Lecteur de signes" },
  },
  st_sulpice_seuil: {
    onsite_code: "MERIDIEN",
    duration_sec: 210,
    questions: [
      { id: "q1", prompt: "Entre le mot trouvé sur place.", type: "text", answer: "MERIDIEN", points: 1 },
      { id: "q2", prompt: "Cette ligne sert à :", type: "mcq", choices: ["Mesurer le temps", "Définir le nord", "Marquer le méridien"], answer: "Marquer le méridien", points: 1 },
      { id: "q3", prompt: "En une phrase : qu'as-tu observé ?", type: "text", answer: "*", points: 1 },
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

function getTodayParisDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

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

function getLast7ParisDays(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: PARIS_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    days.push(formatter.format(date));
  }
  return days;
}

function daysBetweenParisDates(parisDateA: string, parisDateB: string): number {
  const a = new Date(parisDateA + "T00:00:00+01:00");
  const b = new Date(parisDateB + "T00:00:00+01:00");
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getTodayParisMMDD(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

// ============ MIROIR SENTENCE POOLS ============

const BLOC_A_FOUNDATION = [
  "Tu aurais voulu l'oublier, mais la pierre se souvient.",
  "Les rues que tu piétines te soutiendront, même quand tout cède.",
  "Il t'a fallu trois hivers pour remarquer ce visage.",
  "Des rivières de vin coulaient ici, et tu passais sans t'arrêter.",
];

const BLOC_B_CORE = [
  "Tu marches sur ce qui a résisté à pire que toi.",
  "La pierre a vu passer ce que tu appelles encore nouveau.",
  "Tu pensais traverser, mais c'est toi qui restes.",
  "Certains visages attendent des années avant d'être reconnus.",
  "Tu aurais pu partir plus tôt, mais quelque chose a retenu ton pas.",
  "Ce lieu n'a rien promis, pourtant tu reviens.",
  "La ville ne t'a rien dit, et c'est pour cela que tu écoutes.",
  "Tu n'étais pas attendu, mais tu n'es pas de trop.",
];

const BLOC_C_ECHO = [
  "Tu es passé là où quelque chose s'est déjà perdu, et pourtant tu continues.",
  "La ville ne t'attend pas, mais elle remarque quand tu hésites.",
  "Ce que tu n'as pas regardé aujourd'hui pèsera demain plus que le reste.",
  "Tu marches dans une phrase commencée avant toi.",
  "Rien ne t'oblige à rester, sauf ce que tu reconnais sans le nommer.",
  "La distance n'est pas là où tu crois l'avoir parcourue.",
  "Ce lieu a survécu à pire que ton passage — mais pas à ton oubli.",
  "Tu es entré sans savoir ce que tu allais laisser derrière.",
  "La ville ne se souvient pas de toi, mais elle se souvient avec toi.",
  "Ce que tu appelles aujourd'hui ordinaire était autrefois une décision.",
];

// Helper: Map sentence to its pool kind
function sentenceToKind(sentence: string): "foundation" | "core" | "echo" {
  if (BLOC_A_FOUNDATION.includes(sentence)) return "foundation";
  if (BLOC_C_ECHO.includes(sentence)) return "echo";
  return "core";
}

// Simple hash for deterministic selection
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

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
    // Example: "01-15": "Ce jour-là à Paris: ..."
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
      textExcerpt = textExcerpt.slice(0, 87).trim() + "…";
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

// Wrap so we always send CORS with exact origin (never *) — Supabase or Hono may add * otherwise
function corsHeadersFromRequest(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? undefined;
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
