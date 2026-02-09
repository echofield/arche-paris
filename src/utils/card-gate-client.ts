/**
 * ARCHÉ — Card Gate Client (V2 - Secure)
 *
 * SECURITY (V2):
 * - Refresh token: httpOnly cookie (server-managed, not accessible to JS)
 * - Access token: memory only (never in localStorage)
 * - No device_secret in client code
 * - All requests use credentials: 'include' for cookies
 *
 * INVARIANTS:
 * - All journal/trace access goes through Card Gate. Never revert to direct DB.
 * - If Card Gate fails: queue locally / show offline.
 */

const CARD_GATE_BASE = (() => {
  const projectId = import.meta.env?.VITE_SUPABASE_PROJECT_ID ?? '';
  return projectId ? `https://${projectId}.supabase.co/functions/v1/card-gate` : '';
})();

/** Anon key for Supabase Edge invocation (avoids 401 before request reaches card-gate). */
const ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '';

const STORAGE_PENDING_WRITES = 'arche_cg_pending_writes';
const TOKEN_REFRESH_MARGIN_MS = 2 * 60 * 1000; // refresh 2 min before expiry

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

// ============ IN-MEMORY TOKEN STORE ============
// Access tokens are NEVER stored in localStorage - only in memory
interface TokenEntry {
  accessToken: string;
  expiresAt: number; // timestamp ms
  cardId: string;
}

let currentToken: TokenEntry | null = null;

function setMemoryToken(cardId: string, accessToken: string, expiresAt: string): void {
  currentToken = {
    cardId,
    accessToken,
    expiresAt: new Date(expiresAt).getTime(),
  };
}

function getMemoryToken(cardId: string): string | null {
  if (!currentToken || currentToken.cardId !== cardId) return null;
  const now = Date.now();
  if (currentToken.expiresAt - TOKEN_REFRESH_MARGIN_MS <= now) return null; // expired or near expiry
  return currentToken.accessToken;
}

function clearMemoryToken(): void {
  currentToken = null;
}

// ============ PENDING WRITES QUEUE ============

export interface PendingWrite {
  cardId: string;
  type: 'note' | 'entry' | 'trace';
  place_id: string;
  content: string;
  ts: number;
  idempotency_key: string;
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

export function getPendingCardIds(): string[] {
  return [...new Set(getPendingQueue().map((w) => w.cardId))];
}

function isOfflineFailure(res: Response | null): boolean {
  if (!res) return true;
  return res.status >= 500 || res.status === 429;
}

// ============ AUTH FUNCTIONS ============

export function getCardGateBaseUrl(): string {
  return CARD_GATE_BASE;
}

/**
 * Pair device to card. Sets httpOnly cookie on server, returns access token.
 * Call after activation (code+password). 409 = Already paired.
 */
export async function pairDevice(cardId: string): Promise<{ access_token: string; expires_at: string }> {
  if (!CARD_GATE_BASE) throw new Error('Card Gate URL not configured');
  const url = `${CARD_GATE_BASE}/pair`;
  let res: Response;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ANON_KEY) headers['Authorization'] = `Bearer ${ANON_KEY}`;
    res = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include', // Important: send/receive cookies
      body: JSON.stringify({ card_id: cardId }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const errName = e instanceof Error ? e.name : '';

    // Handle abort silently
    if (errName === 'AbortError') {
      throw e;
    }

    // Network/CORS errors - provide clear, actionable messages
    if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed')) {
      throw new Error('Connexion impossible. Vérifiez votre connexion internet ou réessayez dans quelques instants.');
    }
    if (msg.includes('CORS') || msg.includes('blocked')) {
      throw new Error('Erreur de configuration serveur. Contactez le support si le problème persiste.');
    }
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    const err = new Error(data?.error ?? 'Already paired') as Error & { code?: string };
    err.code = 'ALREADY_PAIRED';
    throw err;
  }
  if (!res.ok) {
    const serverMsg = data?.error ?? `Pair failed: ${res.status}`;
    if (res.status === 403 && data?.error === 'Origin not allowed') {
      throw new Error('Origine non autorisée. Vérifiez l’URL du site.');
    }
    throw new Error(serverMsg);
  }
  if (!data?.access_token) throw new Error('No access_token in response');

  // Store in memory only
  setMemoryToken(cardId, data.access_token, data.expires_at);
  return { access_token: data.access_token, expires_at: data.expires_at };
}

/**
 * Refresh access token using httpOnly cookie.
 * Returns new access token (stored in memory).
 */
export async function refreshAccessToken(): Promise<{ access_token: string; expires_at: string; card_id: string }> {
  if (!CARD_GATE_BASE) throw new Error('Card Gate URL not configured');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ANON_KEY) headers['Authorization'] = `Bearer ${ANON_KEY}`;

  let res: Response;
  try {
    res = await fetch(`${CARD_GATE_BASE}/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include', // Send cookie
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed')) {
      throw new Error('Connexion impossible. Vérifiez votre réseau.');
    }
    throw e;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    clearMemoryToken();
    throw new Error(data?.error ?? `Refresh failed: ${res.status}`);
  }
  if (!data?.access_token || !data?.card_id) throw new Error('Invalid refresh response');

  setMemoryToken(data.card_id, data.access_token, data.expires_at);
  return { access_token: data.access_token, expires_at: data.expires_at, card_id: data.card_id };
}

/**
 * Get valid access token for cardId. Refreshes if needed.
 */
export async function getCardToken(cardId: string): Promise<string> {
  // Check memory first
  const memToken = getMemoryToken(cardId);
  if (memToken) return memToken;

  // Refresh from cookie
  const { access_token } = await refreshAccessToken();
  return access_token;
}

/**
 * Check if we have a valid session (refresh cookie works).
 * Used during app init to see if user is logged in.
 */
export async function checkSession(): Promise<{ valid: boolean; cardId?: string }> {
  try {
    const { card_id } = await refreshAccessToken();
    return { valid: true, cardId: card_id };
  } catch {
    return { valid: false };
  }
}

/**
 * Validate with device_secret (legacy/migration support).
 * Sets httpOnly cookie and returns access token.
 */
export async function validateCardAndGetToken(cardId: string, deviceSecret: string): Promise<{ access_token: string; expires_at: string }> {
  if (!CARD_GATE_BASE) throw new Error('Card Gate URL not configured');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ANON_KEY) headers['Authorization'] = `Bearer ${ANON_KEY}`;
  const res = await fetch(`${CARD_GATE_BASE}/validate`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ card_id: cardId, device_secret: deviceSecret }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Validate failed: ${res.status}`);
  if (!data?.access_token) throw new Error('No access_token in response');

  setMemoryToken(cardId, data.access_token, data.expires_at);
  return { access_token: data.access_token, expires_at: data.expires_at };
}

// ============ GATE FETCH (with auto-refresh) ============

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
    credentials: 'include',
    body: options.body,
  });
}

// ============ JOURNAL ============

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

// ============ TRACES ============

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

// ============ FLUSH PENDING ============

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
        if (res.ok || (res.status === 400 && data?.error === 'ALREADY_LEFT_TRACE')) {
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
      // keep in queue
    }
    remaining.push(item);
  }
  setPendingQueue(remaining);
  return sent;
}

// ============ CHAMP (Le Champ - Collective Field) ============

export type FieldItem = {
  id: string;
  arrondissement: number | null;
  textExcerpt: string;
  timeLabel: string;
  created_at: string;
};

export async function loadChampItems(cardId: string): Promise<FieldItem[]> {
  const res = await gateFetch(cardId, '/champ/items');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[card-gate-client] loadChampItems failed:', data?.error ?? res.status);
    return [];
  }
  return (data?.items as FieldItem[]) ?? [];
}

// ============ LOGOUT / UNPAIR ============

/**
 * Clear memory token (logout from this session).
 */
export function clearCardGateStorage(_cardId: string): void {
  clearMemoryToken();
  // Note: httpOnly cookie cannot be cleared by JS - server clears it on unpair
}

/**
 * Unpair device. Calls /unpair-session with credentials (cookie); server clears device_secret_hash and cookie.
 */
export interface UnpairResult {
  ok: boolean;
  message?: string;
  /** If true, card is still paired on server but cookie is missing - need password to force-unpair */
  needsPassword?: boolean;
}

export async function unpairDevice(cardId: string): Promise<UnpairResult> {
  if (!CARD_GATE_BASE) throw new Error('Card Gate URL not configured');
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ANON_KEY) headers['Authorization'] = `Bearer ${ANON_KEY}`;
    const res = await fetch(`${CARD_GATE_BASE}/unpair-session`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ card_id: cardId }), // Send card_id so server can check if still paired
    });
    const data = await res.json().catch(() => ({}));
    clearMemoryToken();

    // Check for "cookie missing but card still paired" case
    if (res.status === 401 && data?.code === 'COOKIE_MISSING_CARD_PAIRED') {
      return {
        ok: false,
        message: data?.message ?? 'Session expirée. Mot de passe requis.',
        needsPassword: true
      };
    }

    if (res.ok) return { ok: true, message: data?.message ?? 'Device unpaired' };
    return { ok: true, message: data?.error ?? 'Session cleared' };
  } catch {
    clearMemoryToken();
    return { ok: true, message: 'Logged out locally' };
  }
}

/**
 * Check if we have a valid session.
 * In V2, this checks if the refresh cookie works.
 */
export function hasLocalSecret(_cardId: string): boolean {
  // In V2, we don't have local secrets - check memory token
  return currentToken !== null;
}

/**
 * Force-unpair using password. Clears server state and cookie.
 */
export async function forceUnpairDevice(cardId: string, password: string): Promise<{ ok: boolean; message?: string }> {
  if (!CARD_GATE_BASE) throw new Error('Card Gate URL not configured');
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ANON_KEY) headers['Authorization'] = `Bearer ${ANON_KEY}`;
    const res = await fetch(`${CARD_GATE_BASE}/force-unpair`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ card_id: cardId, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Provide clearer error messages
      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: 'Mot de passe incorrect.' };
      }
      return { ok: false, message: data?.error ?? `Échec du transfert (${res.status})` };
    }
    clearMemoryToken();
    return { ok: true, message: data?.message ?? 'Carte transférée avec succès' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed')) {
      return { ok: false, message: 'Connexion impossible. Vérifiez votre réseau.' };
    }
    return { ok: false, message: 'Erreur réseau. Réessayez.' };
  }
}
