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
import { cors } from "npm:hono@4.6.14/cors";
import { Hono } from "npm:hono@4.6.14";
import { SignJWT, jwtVerify } from "npm:jose@5.9.6";

const app = new Hono().basePath("/card-gate");

// Allowed origins only (no random site can use visitor's browser as relay)
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
  return false;
}

app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");
  if (origin && !isOriginAllowed(origin)) {
    return c.json({ error: "Origin not allowed" }, 403);
  }
  await next();
});

app.use(
  "*",
  cors({
    origin: (o) => (o && isOriginAllowed(o) ? o : null),
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

const JWT_EXPIRY_HOURS = 4;

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

async function signToken(cardId: string): Promise<string> {
  const secret = Deno.env.get("CARD_GATE_JWT_SECRET");
  if (!secret) throw new Error("CARD_GATE_JWT_SECRET not set");
  const key = new TextEncoder().encode(secret);
  const exp = new Date(Date.now() + JWT_EXPIRY_HOURS * 60 * 60 * 1000);
  return await new SignJWT({ card_id: cardId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(key);
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
  const allowed = await dbRateLimit(supabase, rateKey, 3, 3600);
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

  const deviceSecretB64 = b64urlEncode(deviceSecret);
  return c.json({ device_secret: deviceSecretB64 });
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

  const token = await signToken(cardId);
  const exp = new Date(Date.now() + JWT_EXPIRY_HOURS * 60 * 60 * 1000);
  return c.json({ token, expires_at: exp.toISOString() });
});

// ----- Helper: require JWT -----
async function requireJwt(c: ReturnType<Hono["req"]>): Promise<{ card_id: string } | Response> {
  const auth = c.req.header("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const payload = await verifyToken(token);
  if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { "Content-Type": "application/json" } });
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
  let body: { kind?: string; arrondissement?: number; anchor_id?: string; text?: string; idempotency_key?: string };
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

Deno.serve(app.fetch);
