import { emitDiagnostic } from '../lib/runtime-diagnostics';
import { getCardGateBaseUrl, getCardToken, getSessionCardCode } from './card-gate-client';
import { clearProgressionUxIssue, reportProgressionUxIssue, resetProgressionUxStateForTests } from './progression-ux-state';

export const PROGRESSION_ARTIFACTS = ['collection', 'traces', 'walks', 'quest_runs'] as const;

export type ProgressionArtifact = (typeof PROGRESSION_ARTIFACTS)[number];

export interface ProgressionStateItem {
  payload: unknown;
  updated_at: string;
  version: number;
  client_updated_at?: string | null;
}

export interface ProgressionConflict {
  artifact: ProgressionArtifact;
  server_updated_at: string;
  server_version?: number;
  reason?: string;
}

export interface NormalizedProgressionState {
  items: Partial<Record<ProgressionArtifact, ProgressionStateItem>>;
  conflicts: ProgressionConflict[];
}

export interface ProgressionEntryInput {
  artifact: ProgressionArtifact;
  payload: unknown;
  client_updated_at: string;
  base_version?: number | null;
}

export interface FetchProgressionOptions {
  persistServerMetadata?: boolean;
  source?: string;
}

export interface FetchProgressionResult {
  mode: 'server' | 'local-fallback';
  state: NormalizedProgressionState;
  error?: string;
  status?: number;
}

export interface PushProgressionResult {
  mode: 'server' | 'local-fallback';
  state: NormalizedProgressionState;
  applied: ProgressionArtifact[];
  conflicts: ProgressionConflict[];
  error?: string;
  status?: number;
}

export interface QueueProgressionWriteParams {
  cardId: string | null | undefined;
  artifact: ProgressionArtifact;
  payload: unknown;
  updatedAt?: string | null;
  source: string;
}

const ARTIFACT_SET = new Set<ProgressionArtifact>(PROGRESSION_ARTIFACTS);

const PROGRESSION_UPDATED_AT_KEYS: Record<ProgressionArtifact, string> = {
  collection: 'arche_progression_collection_updated_at_v1',
  traces: 'arche_progression_traces_updated_at_v1',
  walks: 'arche_progression_walks_updated_at_v1',
  quest_runs: 'arche_progression_quest_runs_updated_at_v1',
};

const PROGRESSION_VERSION_PREFIX = 'arche_progression_server_version_v1';
const PROGRESSION_DIRTY_PREFIX = 'arche_progression_dirty_v1';

const EPOCH_ISO = new Date(0).toISOString();
const writeQueues = new Map<string, Promise<void>>();
const writeInFlight = new Set<string>();

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function isProgressionArtifact(value: string): value is ProgressionArtifact {
  return ARTIFACT_SET.has(value as ProgressionArtifact);
}

function readStorage(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures; caller still receives normalized value.
  }
}

function removeStorage(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    // Ignore storage remove failures.
  }
}

function warnContract(
  code: string,
  message: string,
  details: Record<string, unknown>,
  onceKey?: string,
): void {
  emitDiagnostic(
    {
      level: 'warn',
      module: 'CardScopedProgression',
      code,
      message,
      details,
      degraded: true,
    },
    { onceKey },
  );
}

function versionKey(cardId: string, artifact: ProgressionArtifact): string {
  return `${PROGRESSION_VERSION_PREFIX}:${cardId}:${artifact}`;
}

function dirtyKey(cardId: string, artifact: ProgressionArtifact): string {
  return `${PROGRESSION_DIRTY_PREFIX}:${cardId}:${artifact}`;
}

function normalizeVersion(raw: unknown, fallback = 0): number {
  const parsed = typeof raw === 'number'
    ? raw
    : (typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN);

  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  return normalized >= 0 ? normalized : fallback;
}

function hasItemsObject(raw: unknown): boolean {
  const record = asRecord(raw);
  if (!record) return false;
  return asRecord(record.items) != null;
}

export function normalizeIsoTimestamp(raw: unknown, fallbackRaw?: unknown): string {
  const fallbackCandidate = typeof fallbackRaw === 'string' ? fallbackRaw : EPOCH_ISO;
  const fallbackDate = new Date(fallbackCandidate);
  const fallback = Number.isFinite(fallbackDate.getTime()) ? fallbackDate.toISOString() : EPOCH_ISO;

  if (typeof raw !== 'string') return fallback;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

export function canUseCardScopedProgression(cardId: string | null | undefined): cardId is string {
  if (typeof cardId !== 'string') return false;
  const normalized = cardId.trim();
  if (!normalized) return false;
  if (normalized.startsWith('DEMO')) return false;
  return true;
}

export function setProgressionArtifactUpdatedAt(artifact: ProgressionArtifact, rawUpdatedAt: unknown): string {
  const normalized = normalizeIsoTimestamp(rawUpdatedAt, EPOCH_ISO);
  writeStorage(PROGRESSION_UPDATED_AT_KEYS[artifact], normalized);
  return normalized;
}

export function getProgressionArtifactUpdatedAt(artifact: ProgressionArtifact, fallbackRaw?: unknown): string {
  const stored = readStorage(PROGRESSION_UPDATED_AT_KEYS[artifact]);
  const normalized = normalizeIsoTimestamp(stored, fallbackRaw);

  if (stored !== normalized) {
    writeStorage(PROGRESSION_UPDATED_AT_KEYS[artifact], normalized);
  }

  return normalized;
}

export function setProgressionArtifactVersion(
  cardId: string,
  artifact: ProgressionArtifact,
  rawVersion: unknown,
): number {
  const normalized = normalizeVersion(rawVersion, 0);
  writeStorage(versionKey(cardId, artifact), String(normalized));
  return normalized;
}

export function getProgressionArtifactVersion(
  cardId: string,
  artifact: ProgressionArtifact,
  fallback?: number | null,
): number | null {
  const stored = readStorage(versionKey(cardId, artifact));
  if (stored == null) {
    if (fallback == null) return null;
    return normalizeVersion(fallback, 0);
  }
  return normalizeVersion(stored, fallback == null ? 0 : normalizeVersion(fallback, 0));
}

export function setProgressionArtifactDirty(cardId: string, artifact: ProgressionArtifact, dirty: boolean): void {
  if (dirty) {
    writeStorage(dirtyKey(cardId, artifact), '1');
    return;
  }
  removeStorage(dirtyKey(cardId, artifact));
}

export function getDirtyProgressionArtifacts(cardId: string): ProgressionArtifact[] {
  return PROGRESSION_ARTIFACTS.filter((artifact) => readStorage(dirtyKey(cardId, artifact)) === '1');
}

export function hasDirtyProgressionWrites(cardId: string): boolean {
  return getDirtyProgressionArtifacts(cardId).length > 0;
}

export function hasProgressionWriteInFlight(cardId?: string): boolean {
  if (!cardId) return writeInFlight.size > 0;
  const prefix = `${cardId}:`;
  for (const key of writeInFlight.values()) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

function normalizeConflicts(raw: unknown, source: string): ProgressionConflict[] {
  const out: ProgressionConflict[] = [];
  if (!Array.isArray(raw)) return out;

  raw.forEach((entry, index) => {
    const record = asRecord(entry);
    if (!record) return;
    const artifactRaw = typeof record.artifact === 'string' ? record.artifact : null;
    if (!artifactRaw || !isProgressionArtifact(artifactRaw)) {
      warnContract(
        'INVALID_CONFLICT_ARTIFACT',
        'Dropped malformed progression conflict artifact.',
        { source, index },
        `CardScopedProgression:INVALID_CONFLICT_ARTIFACT:${source}:${index}`,
      );
      return;
    }

    const serverVersion = normalizeVersion(record.server_version, 0);
    const reason = typeof record.reason === 'string' ? record.reason : undefined;

    out.push({
      artifact: artifactRaw,
      server_updated_at: normalizeIsoTimestamp(record.server_updated_at, EPOCH_ISO),
      ...(serverVersion > 0 ? { server_version: serverVersion } : {}),
      ...(reason ? { reason } : {}),
    });
  });

  return out;
}

export function normalizeProgressionStatePayload(raw: unknown, source = 'unknown'): NormalizedProgressionState {
  const record = asRecord(raw);
  if (!record) {
    warnContract(
      'INVALID_SERVER_ROOT',
      'Progression payload is not an object; using empty fallback.',
      { source, receivedType: typeof raw },
      `CardScopedProgression:INVALID_SERVER_ROOT:${source}`,
    );
    return { items: {}, conflicts: [] };
  }

  const itemsRecord = asRecord(record.items);
  if (!itemsRecord) {
    warnContract(
      'MISSING_ITEMS_OBJECT',
      'Progression payload missing items object; using empty fallback.',
      { source, keys: Object.keys(record) },
      `CardScopedProgression:MISSING_ITEMS_OBJECT:${source}`,
    );
  }

  const items: Partial<Record<ProgressionArtifact, ProgressionStateItem>> = {};

  PROGRESSION_ARTIFACTS.forEach((artifact) => {
    const itemRecord = asRecord(itemsRecord?.[artifact]);
    if (!itemRecord) return;

    const updatedAt = normalizeIsoTimestamp(itemRecord.updated_at, EPOCH_ISO);
    const payload = Object.prototype.hasOwnProperty.call(itemRecord, 'payload')
      ? itemRecord.payload
      : {};
    const version = normalizeVersion(itemRecord.version, 0);

    items[artifact] = {
      payload,
      updated_at: updatedAt,
      version,
      ...(typeof itemRecord.client_updated_at === 'string'
        ? { client_updated_at: normalizeIsoTimestamp(itemRecord.client_updated_at, EPOCH_ISO) }
        : {}),
    };
  });

  const conflicts = normalizeConflicts(record.conflicts, source);

  return { items, conflicts };
}

function persistServerMetadata(cardId: string, state: NormalizedProgressionState): void {
  PROGRESSION_ARTIFACTS.forEach((artifact) => {
    const item = state.items[artifact];
    if (!item) return;
    setProgressionArtifactUpdatedAt(artifact, item.updated_at);
    setProgressionArtifactVersion(cardId, artifact, item.version);
  });
}

async function gateProgressionFetch(
  cardId: string,
  path: string,
  options?: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
  },
): Promise<Response> {
  const base = getCardGateBaseUrl();
  if (!base) throw new Error('Card Gate URL not configured');

  let token: string | null = null;
  try {
    token = await getCardToken(cardId);
  } catch {
    token = null;
  }

  const headers: Record<string, string> = {};
  if (options?.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const sessionCode = getSessionCardCode() ?? cardId;
  if (sessionCode) headers['X-ARCHE-CARD-CODE'] = sessionCode;

  return fetch(`${base}${path}`, {
    method: options?.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const rawText = await response.text();
  if (!rawText) return {};
  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return {};
  }
}

function classifyFailure(
  status: number | undefined,
  payloadRaw: unknown,
  fallbackError: string,
): { code: string; message: string; details: Record<string, unknown> } {
  const payload = asRecord(payloadRaw);
  const pgCode = typeof payload?.pg_code === 'string' ? payload.pg_code : null;
  const error = typeof payload?.error === 'string' ? payload.error : fallbackError;
  const hint = typeof payload?.hint === 'string' ? payload.hint : null;

  if (status === 401 || status === 403 || error.toLowerCase().includes('authorization')) {
    return {
      code: 'CARD_SESSION_INVALID',
      message: 'Card-scoped progression request rejected because card session is missing or invalid.',
      details: { status, error, hint },
    };
  }

  if (error === 'PROGRESSION_TABLE_MISSING' || pgCode === '42P01' || error.toLowerCase().includes('table') || error.toLowerCase().includes('relation')) {
    return {
      code: 'TABLE_NOT_FOUND',
      message: 'Progression table was not found; required schema is missing in this deployment.',
      details: { status, error, hint, pgCode },
    };
  }

  if (error === 'PROGRESSION_SCHEMA_MISSING' || pgCode === '42703' || error.toLowerCase().includes('column')) {
    return {
      code: 'MIGRATION_MISSING',
      message: 'Progression schema is missing required columns; deployment migration appears incomplete.',
      details: { status, error, hint, pgCode },
    };
  }

  if (error === 'PROGRESSION_POLICY_DENIED' || pgCode === '42501' || error.toLowerCase().includes('permission')) {
    return {
      code: 'RLS_POLICY_DENIED',
      message: 'Progression storage access denied; service role/policy configuration is invalid.',
      details: { status, error, hint, pgCode },
    };
  }

  return {
    code: 'FALLBACK_LOCAL_MODE',
    message: 'Progression request failed; local fallback mode is active.',
    details: { status, error, hint, pgCode },
  };
}

function emitFailureDiagnostic(
  cardId: string,
  source: string,
  status: number | undefined,
  payloadRaw: unknown,
  fallbackError: string,
): string {
  const failure = classifyFailure(status, payloadRaw, fallbackError);
  warnContract(
    failure.code,
    failure.message,
    {
      cardId,
      source,
      ...failure.details,
    },
    `CardScopedProgression:${failure.code}:${source}:${cardId}:${status ?? 'no-status'}`,
  );

  return typeof failure.details.error === 'string' ? failure.details.error : fallbackError;
}

export async function fetchCardProgressionState(
  cardId: string,
  options?: FetchProgressionOptions,
): Promise<FetchProgressionResult> {
  const source = options?.source ?? 'fetchCardProgressionState';
  const shouldPersistServerMetadata = options?.persistServerMetadata ?? true;

  if (!canUseCardScopedProgression(cardId)) {
    warnContract(
      'CARD_SESSION_INVALID',
      'Progression fetch skipped because card session is missing or invalid.',
      { source, cardId },
      `CardScopedProgression:CARD_SESSION_INVALID:${source}:${String(cardId)}`,
    );
    return {
      mode: 'local-fallback',
      state: { items: {}, conflicts: [] },
      error: 'Card-scoped progression requires a valid card session.',
    };
  }

  try {
    const response = await gateProgressionFetch(cardId, '/progression/state');
    const payload = await parseJsonSafe(response);

    if (!response.ok) {
      const fallback = asRecord(payload);
      const fallbackError = typeof fallback?.error === 'string'
        ? fallback.error
        : `Progression state fetch failed (${response.status})`;

      const errorMessage = emitFailureDiagnostic(cardId, source, response.status, payload, fallbackError);

      return {
        mode: 'local-fallback',
        state: { items: {}, conflicts: [] },
        error: errorMessage,
        status: response.status,
      };
    }

    if (!hasItemsObject(payload)) {
      warnContract(
        'MALFORMED_SERVER_RESPONSE',
        'Progression response is missing items object; treating payload as degraded.',
        { source, cardId },
        `CardScopedProgression:MALFORMED_SERVER_RESPONSE:${source}:${cardId}`,
      );
    }

    const state = normalizeProgressionStatePayload(payload, `CardScopedProgression.${source}`);
    if (shouldPersistServerMetadata) persistServerMetadata(cardId, state);

    return {
      mode: 'server',
      state,
      status: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    warnContract(
      'FALLBACK_LOCAL_MODE',
      'Progression state fetch threw; using local fallback.',
      {
        cardId,
        source,
        error: errorMessage,
      },
      `CardScopedProgression:FALLBACK_LOCAL_MODE:fetch-exception:${source}:${cardId}`,
    );

    return {
      mode: 'local-fallback',
      state: { items: {}, conflicts: [] },
      error: errorMessage,
    };
  }
}

export async function pushCardProgressionState(
  cardId: string,
  entries: ProgressionEntryInput[],
  source: string,
): Promise<PushProgressionResult> {
  if (!canUseCardScopedProgression(cardId)) {
    warnContract(
      'CARD_SESSION_INVALID',
      'Progression write skipped because card session is missing or invalid.',
      { source, cardId },
      `CardScopedProgression:CARD_SESSION_INVALID:push:${source}:${String(cardId)}`,
    );
    return {
      mode: 'local-fallback',
      state: { items: {}, conflicts: [] },
      applied: [],
      conflicts: [],
      error: 'Card-scoped progression requires a valid card session.',
    };
  }

  if (entries.length === 0) {
    return {
      mode: 'server',
      state: { items: {}, conflicts: [] },
      applied: [],
      conflicts: [],
    };
  }

  const normalizedEntries = entries.map((entry) => {
    const knownVersion = getProgressionArtifactVersion(cardId, entry.artifact, null);
    const baseVersion = entry.base_version ?? knownVersion ?? 0;

    return {
      artifact: entry.artifact,
      payload: entry.payload,
      client_updated_at: normalizeIsoTimestamp(entry.client_updated_at, EPOCH_ISO),
      base_version: normalizeVersion(baseVersion, 0),
    };
  });

  try {
    const response = await gateProgressionFetch(cardId, '/progression/state', {
      method: 'POST',
      body: {
        entries: normalizedEntries,
        source,
      },
    });

    const payload = await parseJsonSafe(response);
    const parsedPayload = asRecord(payload);

    if (!response.ok) {
      const fallbackError = typeof parsedPayload?.error === 'string'
        ? parsedPayload.error
        : `Progression write failed (${response.status})`;

      const errorMessage = emitFailureDiagnostic(cardId, `push.${source}`, response.status, payload, fallbackError);

      return {
        mode: 'local-fallback',
        state: { items: {}, conflicts: [] },
        applied: [],
        conflicts: [],
        error: errorMessage,
        status: response.status,
      };
    }

    if (!hasItemsObject(payload)) {
      warnContract(
        'MALFORMED_SERVER_RESPONSE',
        'Progression write response is missing items object; treating payload as degraded.',
        { source, cardId },
        `CardScopedProgression:MALFORMED_SERVER_RESPONSE:push:${source}:${cardId}`,
      );
    }

    const state = normalizeProgressionStatePayload(payload, `CardScopedProgression.push.${source}`);
    persistServerMetadata(cardId, state);

    const appliedFromServer = Array.isArray(parsedPayload?.applied)
      ? parsedPayload.applied
          .filter((item): item is string => typeof item === 'string')
          .filter((artifact): artifact is ProgressionArtifact => isProgressionArtifact(artifact))
      : [];

    const conflicts = state.conflicts;
    const conflictArtifacts = new Set(conflicts.map((conflict) => conflict.artifact));

    const applied = appliedFromServer.length > 0
      ? appliedFromServer
      : normalizedEntries
          .map((entry) => entry.artifact)
          .filter((artifact) => !conflictArtifacts.has(artifact));

    return {
      mode: 'server',
      state,
      applied,
      conflicts,
      status: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    warnContract(
      'FALLBACK_LOCAL_MODE',
      'Progression write threw; retaining local state.',
      {
        cardId,
        source,
        error: errorMessage,
      },
      `CardScopedProgression:FALLBACK_LOCAL_MODE:push-exception:${cardId}:${source}`,
    );

    return {
      mode: 'local-fallback',
      state: { items: {}, conflicts: [] },
      applied: [],
      conflicts: [],
      error: errorMessage,
    };
  }
}

export function queueProgressionWrite(params: QueueProgressionWriteParams): void {
  if (!canUseCardScopedProgression(params.cardId)) return;

  const cardId = params.cardId;
  const updatedAt = setProgressionArtifactUpdatedAt(params.artifact, params.updatedAt ?? new Date().toISOString());
  setProgressionArtifactDirty(cardId, params.artifact, true);

  const queueKey = `${cardId}:${params.artifact}`;
  const previous = writeQueues.get(queueKey) ?? Promise.resolve();

  let next: Promise<void>;
  next = previous
    .catch(() => {
      // Continue queue after failures.
    })
    .then(async () => {
      writeInFlight.add(queueKey);
      try {
        const result = await pushCardProgressionState(
          cardId,
          [{
            artifact: params.artifact,
            payload: params.payload,
            client_updated_at: updatedAt,
            base_version: getProgressionArtifactVersion(cardId, params.artifact, 0) ?? 0,
          }],
          params.source,
        );

        if (result.mode === 'local-fallback') {
          warnContract(
            'FALLBACK_LOCAL_MODE',
            'Progression write fallback engaged; state remains local until server recovers.',
            {
              cardId,
              artifact: params.artifact,
              source: params.source,
              error: result.error ?? null,
            },
            `CardScopedProgression:FALLBACK_LOCAL_MODE:queue:${cardId}:${params.artifact}`,
          );
          reportProgressionUxIssue({
            cardId,
            code: 'LOCAL_FALLBACK_MODE',
            message: 'Server unavailable: progression is temporarily running in local mode.',
            recoverable: true,
            artifact: params.artifact,
            details: {
              source: params.source,
              error: result.error ?? null,
            },
          });
          return;
        }

        if (result.applied.includes(params.artifact)) {
          setProgressionArtifactDirty(cardId, params.artifact, false);
          if (!hasDirtyProgressionWrites(cardId)) {
            clearProgressionUxIssue(cardId);
          }
        }

        const artifactConflict = result.conflicts.find((conflict) => conflict.artifact === params.artifact);
        if (artifactConflict) {
          emitDiagnostic(
            {
              level: 'warn',
              module: 'CardScopedProgression',
              code: 'CONFLICT_DETECTED',
              message: 'Progression write skipped because server has newer data.',
              details: {
                cardId,
                artifact: params.artifact,
                source: params.source,
                conflict: artifactConflict,
              },
              degraded: true,
            },
            { onceKey: `CardScopedProgression:CONFLICT_DETECTED:${cardId}:${params.artifact}:${updatedAt}` },
          );

          reportProgressionUxIssue({
            cardId,
            code: 'STALE_BASE_VERSION_CONFLICT',
            message: 'A newer server snapshot exists. Resync is required before retry.',
            recoverable: true,
            artifact: params.artifact,
            details: {
              source: params.source,
              conflict: artifactConflict,
            },
          });
        }
      } finally {
        writeInFlight.delete(queueKey);
      }
    })
    .finally(() => {
      if (writeQueues.get(queueKey) === next) {
        writeQueues.delete(queueKey);
      }
    });

  writeQueues.set(queueKey, next);
}

export function resetProgressionSyncStateForTests(): void {
  writeQueues.clear();
  writeInFlight.clear();
  resetProgressionUxStateForTests();

  PROGRESSION_ARTIFACTS.forEach((artifact) => {
    removeStorage(PROGRESSION_UPDATED_AT_KEYS[artifact]);
  });

  if (typeof localStorage !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(`${PROGRESSION_VERSION_PREFIX}:`) || key.startsWith(`${PROGRESSION_DIRTY_PREFIX}:`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => removeStorage(key));
  }
}



