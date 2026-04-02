/**
 * ARCHE - Walk log (local only)
 * Daily km only from explicit quest closes + manual entries. No tracking.
 */

import type { WalkDay, WalkEntry } from '../types/walk';
import { emitDiagnostic } from '../lib/runtime-diagnostics';
import { getStoredCard } from './card-service';
import {
  canUseCardScopedProgression,
  getProgressionArtifactUpdatedAt,
  queueProgressionWrite,
  setProgressionArtifactUpdatedAt,
} from './progression-sync';

const STORAGE_KEY = 'arche_walk_log_v1';

function getDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayKey(): string {
  return getDateKey(new Date());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function parseWalkEntry(raw: unknown): WalkEntry | null {
  const record = asRecord(raw);
  if (!record) return null;

  const hasRecognizedField =
    typeof record.kind === 'string' ||
    typeof record.label === 'string' ||
    typeof record.questId === 'string' ||
    typeof record.at === 'string' ||
    (typeof record.approxKm === 'number' && Number.isFinite(record.approxKm)) ||
    (typeof record.minutes === 'number' && Number.isFinite(record.minutes));

  if (!hasRecognizedField) return null;

  const rawKind = typeof record.kind === 'string' ? record.kind : null;
  const kind = rawKind === 'quest' || rawKind === 'manual'
    ? rawKind
    : (typeof record.questId === 'string' ? 'quest' : 'manual');

  const label = typeof record.label === 'string' && record.label.trim().length > 0
    ? record.label
    : 'Walk';

  const entry: WalkEntry = {
    kind,
    label,
    at: typeof record.at === 'string' ? record.at : new Date().toISOString(),
  };

  if (typeof record.approxKm === 'number' && Number.isFinite(record.approxKm)) entry.approxKm = record.approxKm;
  if (typeof record.minutes === 'number' && Number.isFinite(record.minutes)) entry.minutes = record.minutes;
  if (typeof record.questId === 'string') entry.questId = record.questId;

  return entry;
}

function parseWalkDay(raw: unknown, dateFallback: string): WalkDay | null {
  const record = asRecord(raw);
  if (!record) return null;

  const entriesRaw = Array.isArray(record.entries) ? record.entries : [];
  const entries = entriesRaw.map(parseWalkEntry).filter((entry): entry is WalkEntry => entry !== null);

  return {
    date: typeof record.date === 'string' ? record.date : dateFallback,
    approxKm: entries.reduce((sum, entry) => sum + (entry.approxKm ?? 0), 0),
    entries,
  };
}

function normalizeWalkLogPayload(
  raw: unknown,
  source: string,
): { log: Record<string, WalkDay>; changed: boolean } {
  const root = asRecord(raw);
  if (!root) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'WalkService',
        code: 'INVALID_ROOT',
        message: 'Walk log payload is not an object; resetting to empty.',
        details: { source },
        degraded: true,
      },
      { onceKey: `WalkService:INVALID_ROOT:${source}` },
    );
    return { log: {}, changed: true };
  }

  const normalized: Record<string, WalkDay> = {};
  let dropped = 0;

  for (const [date, rawDay] of Object.entries(root)) {
    const day = parseWalkDay(rawDay, date);
    if (!day) {
      dropped += 1;
      continue;
    }
    normalized[date] = day;
  }

  const changed = dropped > 0;

  if (dropped > 0) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'WalkService',
        code: 'DAYS_DROPPED',
        message: 'Dropped malformed walk-day entries from local storage.',
        details: { source, dropped, total: Object.keys(root).length },
        degraded: true,
      },
      { onceKey: `WalkService:DAYS_DROPPED:${source}:${dropped}:${Object.keys(root).length}` },
    );
  }

  return { log: normalized, changed };
}

function loadWalkLog(): Record<string, WalkDay> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    const { log, changed } = normalizeWalkLogPayload(parsed, 'walk-service.loadWalkLog');

    if (changed) {
      saveWalkLog(log);
    }

    return log;
  } catch {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'WalkService',
        code: 'JSON_PARSE_FAILED',
        message: 'Failed to parse walk log JSON; resetting to empty.',
        details: { key: STORAGE_KEY },
        degraded: true,
      },
      { onceKey: 'WalkService:JSON_PARSE_FAILED' },
    );
    return {};
  }
}

function saveWalkLog(log: Record<string, WalkDay>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch (e) {
    console.warn('walk-service: save failed', e);
  }
}

export function loadWalkLogPublic(): Record<string, WalkDay> {
  return loadWalkLog();
}

const MILESTONES_SEEN_KEY = 'arche_milestones_seen_v1';
const MILESTONE_THRESHOLDS = [10, 50, 100, 500] as const;

function normalizeMilestones(raw: unknown, source: string): number[] {
  if (!Array.isArray(raw)) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'WalkService',
        code: 'INVALID_MILESTONES',
        message: 'Milestones payload missing array; using empty fallback.',
        details: { source },
        degraded: true,
      },
      { onceKey: `WalkService:INVALID_MILESTONES:${source}` },
    );
    return [];
  }

  return [...new Set(raw.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)))].sort((a, b) => a - b);
}

function loadMilestonesSeen(): number[] {
  try {
    const raw = localStorage.getItem(MILESTONES_SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeMilestones(parsed, 'walk-service.loadMilestonesSeen');
  } catch {
    return [];
  }
}

function saveMilestonesSeen(milestones: number[]): void {
  try {
    localStorage.setItem(MILESTONES_SEEN_KEY, JSON.stringify(milestones));
  } catch (e) {
    console.warn('walk-service: save milestones failed', e);
  }
}

interface WalkSyncPayload {
  log: Record<string, WalkDay>;
  milestonesSeen: number[];
}

function buildWalkSyncPayload(): WalkSyncPayload {
  return {
    log: loadWalkLog(),
    milestonesSeen: loadMilestonesSeen(),
  };
}

function publishWalkSync(source: string): void {
  const cardId = getStoredCard();
  if (!canUseCardScopedProgression(cardId)) return;

  const payload = buildWalkSyncPayload();
  const updatedAt = setProgressionArtifactUpdatedAt('walks', new Date().toISOString());

  queueProgressionWrite({
    cardId,
    artifact: 'walks',
    payload,
    updatedAt,
    source,
  });
}

export function getWalkSyncSnapshot(): { payload: WalkSyncPayload; updatedAt: string } | null {
  const payload = buildWalkSyncPayload();

  const dayKeys = Object.keys(payload.log);
  if (dayKeys.length === 0 && payload.milestonesSeen.length === 0) return null;

  const latestEntryTs = dayKeys
    .flatMap((date) => payload.log[date]?.entries ?? [])
    .map((entry) => new Date(entry.at).getTime())
    .filter((ts) => Number.isFinite(ts));

  const fallback = latestEntryTs.length > 0
    ? new Date(Math.max(...latestEntryTs)).toISOString()
    : new Date(0).toISOString();

  const updatedAt = getProgressionArtifactUpdatedAt('walks', fallback);

  return {
    payload,
    updatedAt,
  };
}

export function applyWalkSyncSnapshot(
  payload: unknown,
  updatedAt: string,
  source = 'walk-service.applyWalkSyncSnapshot',
): boolean {
  const record = asRecord(payload);
  if (!record) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'WalkService',
        code: 'INVALID_SYNC_ROOT',
        message: 'Walk sync snapshot payload is not an object; ignoring snapshot.',
        details: { source, receivedType: typeof payload },
        degraded: true,
      },
      { onceKey: `WalkService:INVALID_SYNC_ROOT:${source}` },
    );
    return false;
  }

  const normalizedLog = normalizeWalkLogPayload(record.log, `${source}.log`).log;
  const milestones = normalizeMilestones(record.milestonesSeen, `${source}.milestones`);

  saveWalkLog(normalizedLog);
  saveMilestonesSeen(milestones);
  const resolvedUpdatedAt = setProgressionArtifactUpdatedAt('walks', updatedAt);

  emitDiagnostic(
    {
      level: 'info',
      module: 'WalkService',
      code: 'SYNC_SNAPSHOT_APPLIED',
      message: 'Applied walk snapshot from card-scoped persistence.',
      details: {
        source,
        dayCount: Object.keys(normalizedLog).length,
        milestoneCount: milestones.length,
        updatedAt: resolvedUpdatedAt,
      },
    },
    { devOnly: true },
  );

  return true;
}

export function addQuestWalk(
  date: string,
  questTitle: string,
  questId: string,
  approxKm?: number,
): void {
  const log = loadWalkLog();
  const day = log[date] ?? { date, approxKm: 0, entries: [] };
  const entry: WalkEntry = {
    kind: 'quest',
    label: questTitle,
    at: new Date().toISOString(),
    approxKm,
    questId,
  };
  day.entries.push(entry);
  day.approxKm = day.entries.reduce((sum, e) => sum + (e.approxKm ?? 0), 0);
  log[date] = day;
  saveWalkLog(log);
  setProgressionArtifactUpdatedAt('walks', new Date().toISOString());
  publishWalkSync('walk-service.addQuestWalk');
}

export function addManualWalk(
  date: string,
  label: string,
  approxKm?: number,
  minutes?: number,
): void {
  const log = loadWalkLog();
  const day = log[date] ?? { date, approxKm: 0, entries: [] };
  const entry: WalkEntry = {
    kind: 'manual',
    label,
    at: new Date().toISOString(),
    approxKm,
    minutes,
  };
  day.entries.push(entry);
  day.approxKm = day.entries.reduce((sum, e) => sum + (e.approxKm ?? 0), 0);
  log[date] = day;
  saveWalkLog(log);
  setProgressionArtifactUpdatedAt('walks', new Date().toISOString());
  publishWalkSync('walk-service.addManualWalk');
}

export function getTodaySummary(): { approxKm: number; entries: WalkEntry[] } {
  const key = getTodayKey();
  const log = loadWalkLog();
  const day = log[key];
  if (!day) return { approxKm: 0, entries: [] };
  return {
    approxKm: day.approxKm,
    entries: [...day.entries],
  };
}

/** Total km walked (all days). Used for silent milestones (10, 50, 100, 500). */
export function getTotalKm(): number {
  const log = loadWalkLog();
  return Object.values(log).reduce((sum, day) => sum + (day.approxKm ?? 0), 0);
}

export function getMilestonesSeen(): number[] {
  return loadMilestonesSeen();
}

export function markMilestoneSeen(km: number): void {
  const seen = loadMilestonesSeen();
  if (seen.includes(km)) return;
  try {
    saveMilestonesSeen([...seen, km].sort((a, b) => a - b));
    setProgressionArtifactUpdatedAt('walks', new Date().toISOString());
    publishWalkSync('walk-service.markMilestoneSeen');
  } catch (e) {
    console.warn('walk-service: markMilestoneSeen failed', e);
  }
}

/** Returns the next threshold not yet seen (e.g. 10 if total >= 10 and 10 not in seen). */
export function getNextMilestoneToInscribe(totalKm: number): number | null {
  const seen = loadMilestonesSeen();
  for (const threshold of MILESTONE_THRESHOLDS) {
    if (totalKm >= threshold && !seen.includes(threshold)) return threshold;
  }
  return null;
}

/** Parse distance string (e.g. "~2 km", "1.5 km") for approx km when quest has no approxKm. */
export function parseApproxKmFromDistance(distance: string | undefined): number | undefined {
  if (!distance || typeof distance !== 'string') return undefined;
  const match = distance.match(/(\d+(?:[.,]\d+)?)\s*km/i);
  if (!match) return undefined;
  const n = parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

