/**
 * ARCHE - My Paris trace service (local only)
 * Legacy: arche_traces (QuestTrace). v1: arche_traces_v1 (QuestThreadTrace).
 */

import type { QuestTrace, QuestThreadTrace, QuestStopStamp } from '../types/traces';
import { emitDiagnostic } from '../lib/runtime-diagnostics';
import { getStoredCard } from './card-service';
import {
  canUseCardScopedProgression,
  getProgressionArtifactUpdatedAt,
  queueProgressionWrite,
  setProgressionArtifactUpdatedAt,
} from './progression-sync';

const STORAGE_KEY = 'arche_traces';
const STORAGE_KEY_V1 = 'arche_traces_v1';

interface TraceSyncPayload {
  legacy: QuestTrace[];
  v1: QuestThreadTrace[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function parseJsonArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeLegacyTrace(raw: unknown, source: string, index: number): QuestTrace | null {
  const record = asRecord(raw);
  if (!record) return null;

  const questId = typeof record.questId === 'string' ? record.questId : null;
  if (!questId) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'TraceService',
        code: 'INVALID_LEGACY_TRACE',
        message: 'Dropped malformed legacy trace without questId.',
        details: { source, index },
        degraded: true,
      },
      { onceKey: `TraceService:INVALID_LEGACY_TRACE:${source}:${index}` },
    );
    return null;
  }

  const rawStops = Array.isArray(record.stops) ? record.stops : [];
  const stops = rawStops
    .map((stop) => {
      const stopRecord = asRecord(stop);
      if (!stopRecord) return null;
      const stopId = typeof stopRecord.stopId === 'string' ? stopRecord.stopId : null;
      const label = typeof stopRecord.label === 'string' ? stopRecord.label : null;
      if (!stopId || !label) return null;
      return { stopId, label };
    })
    .filter((stop): stop is { stopId: string; label: string } => stop !== null);

  return {
    kind: 'quest_walk',
    questId,
    title: typeof record.title === 'string' ? record.title : questId,
    closedAt: typeof record.closedAt === 'string' ? record.closedAt : new Date().toISOString(),
    stops,
  };
}

function normalizeStamp(raw: unknown): QuestStopStamp | null {
  const record = asRecord(raw);
  if (!record) return null;

  const stopId = typeof record.stopId === 'string' ? record.stopId : null;
  const label = typeof record.label === 'string' ? record.label : null;
  if (!stopId || !label) return null;

  const stamp: QuestStopStamp = {
    stopId,
    label,
    at: typeof record.at === 'string' ? record.at : new Date().toISOString(),
  };

  if (typeof record.oracleLine === 'string') {
    stamp.oracleLine = record.oracleLine;
  }

  return stamp;
}

function normalizeThreadTrace(raw: unknown, source: string, index: number): QuestThreadTrace | null {
  const record = asRecord(raw);
  if (!record) return null;

  const traceId = typeof record.traceId === 'string' ? record.traceId : null;
  const questId = typeof record.questId === 'string' ? record.questId : null;
  if (!traceId || !questId) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'TraceService',
        code: 'INVALID_THREAD_TRACE',
        message: 'Dropped malformed v1 trace without traceId/questId.',
        details: { source, index },
        degraded: true,
      },
      { onceKey: `TraceService:INVALID_THREAD_TRACE:${source}:${index}` },
    );
    return null;
  }

  const rawStamps = Array.isArray(record.stamps) ? record.stamps : [];
  const stamps = rawStamps.map(normalizeStamp).filter((stamp): stamp is QuestStopStamp => stamp !== null);

  const trace: QuestThreadTrace = {
    kind: 'quest_thread',
    traceId,
    questId,
    title: typeof record.title === 'string' ? record.title : questId,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    stamps,
  };

  if (typeof record.closedAt === 'string') trace.closedAt = record.closedAt;
  if (typeof record.approxKm === 'number' && Number.isFinite(record.approxKm)) trace.approxKm = record.approxKm;

  return trace;
}

function normalizeLegacyTraceArray(raw: unknown, source: string): QuestTrace[] {
  const rows = Array.isArray(raw) ? raw : [];
  if (!Array.isArray(raw)) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'TraceService',
        code: 'MISSING_LEGACY_ARRAY',
        message: 'Legacy trace payload missing array; using empty fallback.',
        details: { source },
        degraded: true,
      },
      { onceKey: `TraceService:MISSING_LEGACY_ARRAY:${source}` },
    );
  }

  return rows
    .map((item, index) => normalizeLegacyTrace(item, source, index))
    .filter((trace): trace is QuestTrace => trace !== null);
}

function normalizeThreadTraceArray(raw: unknown, source: string): QuestThreadTrace[] {
  const rows = Array.isArray(raw) ? raw : [];
  if (!Array.isArray(raw)) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'TraceService',
        code: 'MISSING_V1_ARRAY',
        message: 'V1 trace payload missing array; using empty fallback.',
        details: { source },
        degraded: true,
      },
      { onceKey: `TraceService:MISSING_V1_ARRAY:${source}` },
    );
  }

  return rows
    .map((item, index) => normalizeThreadTrace(item, source, index))
    .filter((trace): trace is QuestThreadTrace => trace !== null);
}

function loadLegacyTraces(): QuestTrace[] {
  const raw = parseJsonArray(localStorage.getItem(STORAGE_KEY));
  const traces = normalizeLegacyTraceArray(raw, 'trace-service.loadLegacyTraces');

  if (traces.length !== raw.length) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'TraceService',
        code: 'LEGACY_STORAGE_NORMALIZED',
        message: 'Normalized malformed legacy traces from local storage.',
        details: { dropped: raw.length - traces.length, total: raw.length },
        degraded: true,
      },
      { onceKey: `TraceService:LEGACY_STORAGE_NORMALIZED:${raw.length - traces.length}:${raw.length}` },
    );
    saveTraces(traces);
  }

  return traces;
}

function saveTraces(traces: QuestTrace[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(traces));
  } catch (e) {
    console.warn('trace-service: save failed', e);
  }
}

function loadTracesV1Raw(): QuestThreadTrace[] {
  const raw = parseJsonArray(localStorage.getItem(STORAGE_KEY_V1));
  const traces = normalizeThreadTraceArray(raw, 'trace-service.loadTracesV1');

  if (traces.length !== raw.length) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'TraceService',
        code: 'V1_STORAGE_NORMALIZED',
        message: 'Normalized malformed v1 traces from local storage.',
        details: { dropped: raw.length - traces.length, total: raw.length },
        degraded: true,
      },
      { onceKey: `TraceService:V1_STORAGE_NORMALIZED:${raw.length - traces.length}:${raw.length}` },
    );
    saveTracesV1(traces);
  }

  return traces;
}

function saveTracesV1(traces: QuestThreadTrace[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(traces));
  } catch (e) {
    console.warn('trace-service: save v1 failed', e);
  }
}

function buildTraceSyncPayload(): TraceSyncPayload {
  return {
    legacy: loadLegacyTraces(),
    v1: loadTracesV1Raw(),
  };
}

function publishTraceSync(source: string): void {
  const cardId = getStoredCard();
  if (!canUseCardScopedProgression(cardId)) return;

  const payload = buildTraceSyncPayload();
  const updatedAt = setProgressionArtifactUpdatedAt('traces', new Date().toISOString());

  queueProgressionWrite({
    cardId,
    artifact: 'traces',
    payload,
    updatedAt,
    source,
  });
}

export function getTraceSyncSnapshot(): { payload: TraceSyncPayload; updatedAt: string } | null {
  const payload = buildTraceSyncPayload();
  if (payload.legacy.length === 0 && payload.v1.length === 0) return null;

  const latestFromData = [
    ...payload.legacy.map((trace) => trace.closedAt),
    ...payload.v1.flatMap((trace) => [trace.createdAt, trace.closedAt ?? null, ...trace.stamps.map((stamp) => stamp.at)]),
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  const fallback = latestFromData.length > 0
    ? new Date(Math.max(...latestFromData)).toISOString()
    : new Date(0).toISOString();

  const updatedAt = getProgressionArtifactUpdatedAt('traces', fallback);
  return {
    payload,
    updatedAt,
  };
}

export function applyTraceSyncSnapshot(
  payload: unknown,
  updatedAt: string,
  source = 'trace-service.applyTraceSyncSnapshot',
): boolean {
  const record = asRecord(payload);
  if (!record) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'TraceService',
        code: 'INVALID_SYNC_ROOT',
        message: 'Trace sync snapshot payload is not an object; ignoring snapshot.',
        details: { source, receivedType: typeof payload },
        degraded: true,
      },
      { onceKey: `TraceService:INVALID_SYNC_ROOT:${source}` },
    );
    return false;
  }

  const legacy = normalizeLegacyTraceArray(record.legacy, `${source}.legacy`);
  const v1 = normalizeThreadTraceArray(record.v1, `${source}.v1`);

  saveTraces(legacy);
  saveTracesV1(v1);
  const resolvedUpdatedAt = setProgressionArtifactUpdatedAt('traces', updatedAt);

  emitDiagnostic(
    {
      level: 'info',
      module: 'TraceService',
      code: 'SYNC_SNAPSHOT_APPLIED',
      message: 'Applied trace snapshot from card-scoped persistence.',
      details: {
        source,
        legacyCount: legacy.length,
        v1Count: v1.length,
        updatedAt: resolvedUpdatedAt,
      },
    },
    { devOnly: true },
  );

  return true;
}

export function addQuestTrace(trace: QuestTrace): void {
  const traces = loadLegacyTraces();
  traces.push(trace);
  saveTraces(traces);
  publishTraceSync('trace-service.addQuestTrace');
}

export function listTraces(): QuestTrace[] {
  return loadLegacyTraces();
}

// --- v1 (QuestThreadTrace) ---

export function loadTracesV1(): QuestThreadTrace[] {
  return loadTracesV1Raw();
}

export function addOrUpdateQuestTraceV1(trace: QuestThreadTrace): void {
  const traces = loadTracesV1Raw();
  const idx = traces.findIndex((t) => t.traceId === trace.traceId);
  if (idx >= 0) traces[idx] = trace;
  else traces.push(trace);
  saveTracesV1(traces);
  publishTraceSync('trace-service.addOrUpdateQuestTraceV1');
}

export function getTracesForQuestV1(questId: string): QuestThreadTrace[] {
  return loadTracesV1Raw().filter((trace) => trace.questId === questId);
}
