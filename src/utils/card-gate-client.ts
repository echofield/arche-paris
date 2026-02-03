/**
 * ARCHÉ — Card Gate Client (V1)
 *
 * INVARIANTS (no fallback):
 * - All journal/trace access goes through Card Gate. Never revert to direct DB.
 * - If Card Gate fails: queue locally / show offline.
 * - Token: JWT scoped per cardId, 4h; refresh silently via /validate.
 * - device_secret: 32 bytes, stored locally; only hash in DB.
 */

const CARD_GATE_BASE = (() => {
  const projectId = import.meta.env?.VITE_SUPABASE_PROJECT_ID ?? '';
  return projectId ? `https://${projectId}.supabase.co/functions/v1/card-gate` : '';
})();

const STORAGE_DEVICE_SECRETS = 'arche_cg_secrets';
const STORAGE_TOKENS = 'arche_cg_tokens';
const STORAGE_PENDING_WRITES = 'arche_cg_pending_writes';
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000; // refresh 5 min before expiry

/** Max queue length; when exceeded, oldest ops are dropped (keep newest). */
export const MAX_QUEUE_LENGTH = 200;
/** Max content length per op (matches server). */
export const MAX_JOURNAL_CONTENT = 10000;
export const MAX_TRACE_CONTENT = 140;

/** Shown when Card Gate fails: traces are queued locally until network returns. */
export const OFFLINE_MESSAGE =
  'La ville est silencieuse. Tes traces sont gardées. Elles se graveront dès que le réseau revient.';

/** Shown when queue was trimmed due to cap. */
export const COMPRESSED_MESSAGE =
  'Trop de traces en attente. Certaines ont été compressées.';

let lastCompressedAt = 0;
export function getLastCompressedAt(): number {
  return lastCompressedAt;
}

export function getOfflineMessage(): string {
  return OFFLINE_MESSAGE;
}

/** Thrown when a write fails due to network/5xx/429; write is queued locally. */
export class CardGateOfflineError extends Error {
  code = 'CARD_GATE_OFFLINE';
  constructor(message: string = OFFLINE_MESSAGE) {
    super(message);
    this.name = 'CardGateOfflineError';
  }
}

type TokenEntry = { token: string; expires_at: string };

export interface PendingWrite {
  cardId: string;
  type: 'note' | 'entry' | 'trace';
  place_id: string;
  content: string;
  ts: number;
  idempotency_key: string;
  /** For type 'trace' only */
  quest_id?: string;
  etape_id?: string;
}

function getPendingQueue(): PendingWrite[] {
  try {
    const raw = localStorage.getItem(STORAGE_PENDING_WRITES);
    return raw ? (JSON.parse(raw) as PendingWrite[]) : [];
  } catch {
    return [];
  }
}

const queueListeners = new Set<() => void>();

function setPendingQueue(queue: PendingWrite[]): void {
  localStorage.setItem(STORAGE_PENDING_WRITES, JSON.stringify(queue));
  queueListeners.forEach((fn) => fn());
}

/** Subscribe to queue changes (e.g. for SyncState). Returns unsubscribe. */
export function subscribeToQueueChange(fn: () => void): () => void {
  queueListeners.add(fn);
  return () => queueListeners.delete(fn);
}

function capContent(item: PendingWrite): PendingWrite {
  const max = item.type === 'trace' ? MAX_TRACE_CONTENT : MAX_JOURNAL_CONTENT;
  if (item.content.length <= max) return item;
  return { ...item, content: item.content.slice(0, max) };
}

function addToPendingQueue(item: PendingWrite): void {
  const capped = capContent(item);
  let q = getPendingQueue();
  if (q.length >= MAX_QUEUE_LENGTH) {
    q = q.slice(-(MAX_QUEUE_LENGTH - 1));
    lastCompressedAt = Date.now();
  }
  q.push(capped);
  setPendingQueue(q);
}

export function getPendingWritesCount(): number {
  return getPendingQueue().length;
}

/** Unique card IDs that have pending writes (for flush-on-online). */
export function getPendingCardIds(): string[] {
  return [...new Set(getPendingQueue().map((w) => w.cardId))];
}

/** Treat as offline: queue write and show message. */
function isOfflineFailure(res: Response | null, _err?: unknown): boolean {
  if (!res) return true; // network error
  return res.status >= 500 || res.status === 429;
}

function getSecrets(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_DEVICE_SECRETS);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function setSecret(cardId: string, deviceSecret: string): void {
  const secrets = getSecrets();
  secrets[cardId] = deviceSecret;
  localStorage.setItem(STORAGE_DEVICE_SECRETS, JSON.stringify(secrets));
}

function getSecret(cardId: string): string | null {
  return getSecrets()[cardId] ?? null;
}

function getTokens(): Record<string, TokenEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_TOKENS);
    return raw ? (JSON.parse(raw) as Record<string, TokenEntry>) : {};
  } catch {
    return {};
  }
}

function setToken(cardId: string, entry: TokenEntry): void {
  const tokens = getTokens();
  tokens[cardId] = entry;
  localStorage.setItem(STORAGE_TOKENS, JSON.stringify(tokens));
}

export function getCardGateBaseUrl(): string {
  return CARD_GATE_BASE;
}

/**
 * Pair this device to the card (one-time). Call after activation (code+password).
 * Returns device_secret; stored locally. 409 = Already paired.
 */
const ANON_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string) : '';

export async function pairDevice(cardId: string): Promise<{ device_secret: string }> {
  if (!CARD_GATE_BASE) throw new Error('Card Gate URL not configured');
  const res = await fetch(`${CARD_GATE_BASE}/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}` } : {}) },
    body: JSON.stringify({ card_id: cardId }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    const err = new Error(data?.error ?? 'Already paired') as Error & { code?: string };
    err.code = 'ALREADY_PAIRED';
    throw err;
  }
  if (!res.ok) throw new Error(data?.error ?? `Pair failed: ${res.status}`);
  if (!data?.device_secret) throw new Error('No device_secret in response');
  setSecret(cardId, data.device_secret);
  return { device_secret: data.device_secret };
}

/**
 * Validate card_id + device_secret and get a short-lived JWT. Refresh via this.
 */
export async function validateCardAndGetToken(cardId: string): Promise<{ token: string; expires_at: string }> {
  if (!CARD_GATE_BASE) throw new Error('Card Gate URL not configured');
  const deviceSecret = getSecret(cardId);
  if (!deviceSecret) throw new Error('Not paired. Call pairDevice after activation.');
  const res = await fetch(`${CARD_GATE_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}` } : {}) },
    body: JSON.stringify({ card_id: cardId, device_secret: deviceSecret }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Validate failed: ${res.status}`);
  if (!data?.token || !data?.expires_at) throw new Error('No token in response');
  setToken(cardId, { token: data.token, expires_at: data.expires_at });
  return { token: data.token, expires_at: data.expires_at };
}

/**
 * Get token for cardId; refresh if expired or near expiry. Use for all Gate requests.
 */
export async function getCardToken(cardId: string): Promise<string> {
  const tokens = getTokens();
  const entry = tokens[cardId];
  const now = Date.now();
  const expiresAt = entry?.expires_at ? new Date(entry.expires_at).getTime() : 0;
  if (entry?.token && expiresAt - TOKEN_REFRESH_MARGIN_MS > now) return entry.token;
  const { token } = await validateCardAndGetToken(cardId);
  return token;
}

async function gateFetch(
  cardId: string,
  path: string,
  options: { method?: string; body?: string; headers?: Record<string, string> } = {}
): Promise<Response> {
  const token = await getCardToken(cardId);
  const url = `${CARD_GATE_BASE}${path}`;
  return fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    body: options.body,
  });
}

// ---------- Journal (Card Gate only; no direct DB) ----------

export const MY_PARIS_PLACE_ID = '__my_paris__';
export const WALK_PLACE_ID = '__walk__';
export const ECHO_PLACE_ID_PREFIX = '__echo__';
export const MILESTONE_PLACE_ID = '__milestone__';
export const MERIDIEN_PLACE_ID_PREFIX = '__meridien__';
export const AURA_SEAL_PLACE_ID = '__aura_seal__';

export async function loadMyParisNote(cardId: string): Promise<string> {
  const res = await gateFetch(cardId, '/journal/note?place_id=__my_paris__');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Load note failed: ${res.status}`);
  return (data?.content as string) ?? '';
}

function nextIdempotencyKey(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveMyParisNote(cardId: string, content: string, idempotencyKey?: string): Promise<void> {
  const capped = content.length > MAX_JOURNAL_CONTENT ? content.slice(0, MAX_JOURNAL_CONTENT) : content;
  const key = idempotencyKey ?? nextIdempotencyKey(`note:${MY_PARIS_PLACE_ID}`);
  let res: Response | null = null;
  try {
    res = await gateFetch(cardId, '/journal/note', {
      method: 'POST',
      body: JSON.stringify({ content: capped, place_id: MY_PARIS_PLACE_ID, idempotency_key: key }),
    });
  } catch (_e) {
    addToPendingQueue({ cardId, type: 'note', place_id: MY_PARIS_PLACE_ID, content: capped, ts: Date.now(), idempotency_key: key });
    throw new CardGateOfflineError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (isOfflineFailure(res)) {
      addToPendingQueue({ cardId, type: 'note', place_id: MY_PARIS_PLACE_ID, content: capped, ts: Date.now(), idempotency_key: key });
      throw new CardGateOfflineError();
    }
    throw new Error(data?.error ?? `Save note failed: ${res.status}`);
  }
}

export async function loadJournalEntries(cardId: string): Promise<Array<{ id: string; content: string; place_id: string | null; created_at: string; updated_at: string }>> {
  const res = await gateFetch(cardId, '/journal/list');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Load journal failed: ${res.status}`);
  return (data?.entries as Array<{ id: string; content: string; place_id: string | null; created_at: string; updated_at: string }>) ?? [];
}

export async function appendJournalEntry(cardId: string, placeId: string, content: string, idempotencyKey?: string): Promise<void> {
  const capped = content.length > MAX_JOURNAL_CONTENT ? content.slice(0, MAX_JOURNAL_CONTENT) : content;
  const key = idempotencyKey ?? nextIdempotencyKey(`entry:${placeId}`);
  let res: Response | null = null;
  try {
    res = await gateFetch(cardId, '/journal/entries', {
      method: 'POST',
      body: JSON.stringify({ place_id: placeId, content: capped, idempotency_key: key }),
    });
  } catch (_e) {
    addToPendingQueue({ cardId, type: 'entry', place_id: placeId, content: capped, ts: Date.now(), idempotency_key: key });
    throw new CardGateOfflineError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (isOfflineFailure(res)) {
      addToPendingQueue({ cardId, type: 'entry', place_id: placeId, content: capped, ts: Date.now(), idempotency_key: key });
      throw new CardGateOfflineError();
    }
    throw new Error(data?.error ?? `Append entry failed: ${res.status}`);
  }
}

// ---------- Traces (Card Gate only) ----------

export interface GateTrace {
  content: string;
  card_id: string;
  created_at: string;
}

export async function getTraces(
  cardId: string,
  questId: string,
  etapeId: string,
  limit: number = 3
): Promise<GateTrace[]> {
  const q = new URLSearchParams({ quest_id: questId, etape_id: etapeId, limit: String(limit) });
  const res = await gateFetch(cardId, `/trace/list?${q}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Load traces failed: ${res.status}`);
  return (data?.traces as GateTrace[]) ?? [];
}

export interface LeaveTraceResult {
  success: boolean;
  message: string;
  error?: string;
}

/** One idempotency key per (quest, etape) so retries don't duplicate. */
export function traceIdempotencyKey(questId: string, etapeId: string): string {
  return `trace:${questId}:${etapeId}`;
}

export async function leaveTrace(
  cardId: string,
  questId: string,
  etapeId: string,
  content: string
): Promise<LeaveTraceResult> {
  const trimmed = content.trim();
  if (trimmed.length < 3) return { success: false, message: 'Trop court. Au moins 3 caractères.', error: 'TOO_SHORT' };
  if (trimmed.length > 140) return { success: false, message: 'Trop long. Maximum 140 caractères.', error: 'TOO_LONG' };
  const idempotencyKey = traceIdempotencyKey(questId, etapeId);
  let res: Response | null = null;
  try {
    res = await gateFetch(cardId, '/trace/leave', {
      method: 'POST',
      body: JSON.stringify({ quest_id: questId, etape_id: etapeId, content: trimmed, idempotency_key: idempotencyKey }),
    });
  } catch (_e) {
    addToPendingQueue({
      cardId,
      type: 'trace',
      place_id: '',
      content: trimmed,
      ts: Date.now(),
      idempotency_key: idempotencyKey,
      quest_id: questId,
      etape_id: etapeId,
    });
    return { success: false, message: getOfflineMessage(), error: 'CARD_GATE_OFFLINE' };
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 400 && data?.error === 'ALREADY_LEFT_TRACE') {
    return { success: false, message: data?.message ?? 'Vous avez déjà laissé une trace ici.', error: 'ALREADY_LEFT_TRACE' };
  }
  if (!res.ok) {
    if (isOfflineFailure(res)) {
      addToPendingQueue({
        cardId,
        type: 'trace',
        place_id: '',
        content: trimmed,
        ts: Date.now(),
        idempotency_key: idempotencyKey,
        quest_id: questId,
        etape_id: etapeId,
      });
      return { success: false, message: getOfflineMessage(), error: 'CARD_GATE_OFFLINE' };
    }
    return { success: false, message: data?.message ?? data?.error ?? `Leave trace failed: ${res.status}`, error: 'GATE_ERROR' };
  }
  return { success: true, message: (data?.message as string) ?? 'Trace laissée.' };
}

export async function hasLeftTrace(cardId: string, questId: string, etapeId: string): Promise<boolean> {
  const q = new URLSearchParams({ quest_id: questId, etape_id: etapeId });
  const res = await gateFetch(cardId, `/trace/check?${q}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return false;
  return (data?.has_left as boolean) ?? false;
}

/**
 * Flush pending writes (journal + trace) for a card. Call when back online (e.g. focus/retry).
 * Uses stored idempotency_key so server dedupes. Returns number of items successfully sent.
 */
export async function flushPendingWrites(cardId: string): Promise<number> {
  const queue = getPendingQueue().filter((w) => w.cardId === cardId);
  if (queue.length === 0) return 0;
  let sent = 0;
  const remaining = getPendingQueue().filter((w) => w.cardId !== cardId);
  for (const item of queue) {
    try {
      if (item.type === 'note') {
        const res = await gateFetch(cardId, '/journal/note', {
          method: 'POST',
          body: JSON.stringify({
            content: item.content,
            place_id: item.place_id,
            idempotency_key: item.idempotency_key,
          }),
        });
        if (res.ok) {
          sent++;
          continue;
        }
      } else if (item.type === 'trace' && item.quest_id != null && item.etape_id != null) {
        const res = await gateFetch(cardId, '/trace/leave', {
          method: 'POST',
          body: JSON.stringify({
            quest_id: item.quest_id,
            etape_id: item.etape_id,
            content: item.content,
            idempotency_key: item.idempotency_key,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok || (res.status === 400 && (data?.error === 'ALREADY_LEFT_TRACE'))) {
          sent++;
          continue;
        }
      } else {
        const res = await gateFetch(cardId, '/journal/entries', {
          method: 'POST',
          body: JSON.stringify({
            place_id: item.place_id,
            content: item.content,
            idempotency_key: item.idempotency_key,
          }),
        });
        if (res.ok) {
          sent++;
          continue;
        }
      }
    } catch (_e) {
      // keep in queue for next flush
    }
    remaining.push(item);
  }
  setPendingQueue(remaining);
  return sent;
}

/**
 * Clear stored device secret and token for a card (e.g. logout / testing).
 */
export function clearCardGateStorage(cardId: string): void {
  const secrets = getSecrets();
  delete secrets[cardId];
  localStorage.setItem(STORAGE_DEVICE_SECRETS, JSON.stringify(secrets));
  const tokens = getTokens();
  delete tokens[cardId];
  localStorage.setItem(STORAGE_TOKENS, JSON.stringify(tokens));
}
