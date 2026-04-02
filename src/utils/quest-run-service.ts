/**
 * ARCHE - Quest run service (localStorage only)
 * Keys: arche_quest_runs, arche_active_run, arche_temporal_meridians_unlocked
 */

import type { QuestRun } from '../types/quest-run';
import { emitDiagnostic } from '../lib/runtime-diagnostics';
import { getStoredCard } from './card-service';
import {
  canUseCardScopedProgression,
  getProgressionArtifactUpdatedAt,
  queueProgressionWrite,
  setProgressionArtifactUpdatedAt,
} from './progression-sync';

const RUNS_KEY = 'arche_quest_runs';
const ACTIVE_RUN_KEY = 'arche_active_run';
const TEMPORAL_MERIDIANS_UNLOCKED_KEY = 'arche_temporal_meridians_unlocked';

interface QuestRunSyncPayload {
  runs: QuestRun[];
  activeRunId: string | null;
  temporalMeridiansUnlocked: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function normalizeVisited(raw: unknown): Record<string, { at: string; evidenceLocalIds?: string[] }> {
  const record = asRecord(raw);
  if (!record) return {};

  const visited: Record<string, { at: string; evidenceLocalIds?: string[] }> = {};
  for (const [nodeId, stampRaw] of Object.entries(record)) {
    const stampRecord = asRecord(stampRaw);
    if (!stampRecord) continue;
    const at = typeof stampRecord.at === 'string' ? stampRecord.at : new Date().toISOString();
    const evidenceLocalIds = Array.isArray(stampRecord.evidenceLocalIds)
      ? stampRecord.evidenceLocalIds.filter((id): id is string => typeof id === 'string')
      : undefined;

    visited[nodeId] = {
      at,
      ...(evidenceLocalIds && evidenceLocalIds.length > 0 ? { evidenceLocalIds } : {}),
    };
  }

  return visited;
}

function normalizeRun(raw: unknown, index: number): QuestRun | null {
  const record = asRecord(raw);
  if (!record) return null;

  const runId = typeof record.runId === 'string' ? record.runId : null;
  const questId = typeof record.questId === 'string' ? record.questId : null;
  if (!runId || !questId) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'QuestRunService',
        code: 'INVALID_RUN',
        message: 'Dropped malformed quest run entry.',
        details: { index },
        degraded: true,
      },
      { onceKey: `QuestRunService:INVALID_RUN:${index}` },
    );
    return null;
  }

  const run: QuestRun = {
    runId,
    questId,
    startedAt: typeof record.startedAt === 'string' ? record.startedAt : new Date().toISOString(),
    visited: normalizeVisited(record.visited),
  };

  if (typeof record.closedAt === 'string') run.closedAt = record.closedAt;
  const rewardRecord = asRecord(record.reward);
  if (rewardRecord && rewardRecord.kind === 'card' && typeof rewardRecord.id === 'string') {
    run.reward = { kind: 'card', id: rewardRecord.id };
  }

  return run;
}

function normalizeRunArray(raw: unknown, source: string): QuestRun[] {
  const rows = Array.isArray(raw) ? raw : [];

  if (!Array.isArray(raw)) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'QuestRunService',
        code: 'INVALID_RUNS_ARRAY',
        message: 'Quest runs payload missing array; using empty fallback.',
        details: { source },
        degraded: true,
      },
      { onceKey: `QuestRunService:INVALID_RUNS_ARRAY:${source}` },
    );
  }

  return rows
    .map((entry, index) => normalizeRun(entry, index))
    .filter((run): run is QuestRun => run !== null);
}

function loadRuns(): QuestRun[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const runs = normalizeRunArray(parsed, 'quest-run-service.loadRuns');

    const parsedLength = Array.isArray(parsed) ? parsed.length : 0;
    if (runs.length !== parsedLength) {
      emitDiagnostic(
        {
          level: 'warn',
          module: 'QuestRunService',
          code: 'RUNS_STORAGE_NORMALIZED',
          message: 'Normalized malformed quest runs from local storage.',
          details: { dropped: parsedLength - runs.length, total: parsedLength },
          degraded: true,
        },
        { onceKey: `QuestRunService:RUNS_STORAGE_NORMALIZED:${parsedLength - runs.length}:${parsedLength}` },
      );
      saveRuns(runs);
    }

    return runs;
  } catch {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'QuestRunService',
        code: 'JSON_PARSE_FAILED',
        message: 'Failed to parse quest run storage JSON.',
        details: { key: RUNS_KEY },
        degraded: true,
      },
      { onceKey: 'QuestRunService:JSON_PARSE_FAILED' },
    );
    return [];
  }
}

function saveRuns(runs: QuestRun[]): void {
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  } catch (e) {
    console.warn('quest-run-service: save runs failed', e);
  }
}

function getActiveRunId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_RUN_KEY);
  } catch {
    return null;
  }
}

function setActiveRunId(runId: string | null): void {
  try {
    if (runId == null) localStorage.removeItem(ACTIVE_RUN_KEY);
    else localStorage.setItem(ACTIVE_RUN_KEY, runId);
  } catch (e) {
    console.warn('quest-run-service: set active run failed', e);
  }
}

function isTemporalMeridiansUnlockedInternal(): boolean {
  try {
    return localStorage.getItem(TEMPORAL_MERIDIANS_UNLOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

function buildQuestRunSyncPayload(): QuestRunSyncPayload {
  return {
    runs: loadRuns(),
    activeRunId: getActiveRunId(),
    temporalMeridiansUnlocked: isTemporalMeridiansUnlockedInternal(),
  };
}

function publishQuestRunsSync(source: string): void {
  const cardId = getStoredCard();
  if (!canUseCardScopedProgression(cardId)) return;

  const payload = buildQuestRunSyncPayload();
  const updatedAt = setProgressionArtifactUpdatedAt('quest_runs', new Date().toISOString());

  queueProgressionWrite({
    cardId,
    artifact: 'quest_runs',
    payload,
    updatedAt,
    source,
  });
}

export function getQuestRunSyncSnapshot(): { payload: QuestRunSyncPayload; updatedAt: string } | null {
  const payload = buildQuestRunSyncPayload();
  if (payload.runs.length === 0 && payload.activeRunId == null && !payload.temporalMeridiansUnlocked) return null;

  const runTimestamps = payload.runs
    .flatMap((run) => [
      run.startedAt,
      run.closedAt ?? null,
      ...Object.values(run.visited).map((stamp) => stamp.at),
    ])
    .filter((value): value is string => typeof value === 'string')
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  const fallback = runTimestamps.length > 0
    ? new Date(Math.max(...runTimestamps)).toISOString()
    : new Date(0).toISOString();

  const updatedAt = getProgressionArtifactUpdatedAt('quest_runs', fallback);

  return {
    payload,
    updatedAt,
  };
}

export function applyQuestRunSyncSnapshot(
  payload: unknown,
  updatedAt: string,
  source = 'quest-run-service.applyQuestRunSyncSnapshot',
): boolean {
  const record = asRecord(payload);
  if (!record) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'QuestRunService',
        code: 'INVALID_SYNC_ROOT',
        message: 'Quest-run sync snapshot payload is not an object; ignoring snapshot.',
        details: { source, receivedType: typeof payload },
        degraded: true,
      },
      { onceKey: `QuestRunService:INVALID_SYNC_ROOT:${source}` },
    );
    return false;
  }

  const runs = normalizeRunArray(record.runs, `${source}.runs`);
  const activeRunId = typeof record.activeRunId === 'string' && runs.some((run) => run.runId === record.activeRunId)
    ? record.activeRunId
    : null;
  const temporalUnlocked = record.temporalMeridiansUnlocked === true;

  saveRuns(runs);
  setActiveRunId(activeRunId);
  try {
    if (temporalUnlocked) localStorage.setItem(TEMPORAL_MERIDIANS_UNLOCKED_KEY, 'true');
    else localStorage.removeItem(TEMPORAL_MERIDIANS_UNLOCKED_KEY);
  } catch {
    // Ignore storage failures.
  }

  const resolvedUpdatedAt = setProgressionArtifactUpdatedAt('quest_runs', updatedAt);

  emitDiagnostic(
    {
      level: 'info',
      module: 'QuestRunService',
      code: 'SYNC_SNAPSHOT_APPLIED',
      message: 'Applied quest-run snapshot from card-scoped persistence.',
      details: {
        source,
        runCount: runs.length,
        activeRunId,
        temporalUnlocked,
        updatedAt: resolvedUpdatedAt,
      },
    },
    { devOnly: true },
  );

  return true;
}

export function startRun(questId: string): QuestRun {
  const runs = loadRuns();
  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const run: QuestRun = {
    runId,
    questId,
    startedAt: new Date().toISOString(),
    visited: {},
  };
  runs.push(run);
  saveRuns(runs);
  setActiveRunId(runId);
  setProgressionArtifactUpdatedAt('quest_runs', new Date().toISOString());
  publishQuestRunsSync('quest-run-service.startRun');
  return run;
}

export function stampNode(
  runId: string,
  nodeId: string,
  evidenceLocalIds?: string[],
): void {
  const runs = loadRuns();
  const run = runs.find((r) => r.runId === runId);
  if (!run) return;
  run.visited[nodeId] = {
    at: new Date().toISOString(),
    evidenceLocalIds,
  };
  saveRuns(runs);
  setProgressionArtifactUpdatedAt('quest_runs', new Date().toISOString());
  publishQuestRunsSync('quest-run-service.stampNode');
}

export function closeRun(runId: string, reward?: { kind: 'card'; id: string }): void {
  const runs = loadRuns();
  const run = runs.find((r) => r.runId === runId);
  if (!run) return;
  run.closedAt = new Date().toISOString();
  if (reward) run.reward = reward;
  saveRuns(runs);
  if (getActiveRunId() === runId) setActiveRunId(null);
  if (run.questId === 'temporal-meridians') {
    try {
      localStorage.setItem(TEMPORAL_MERIDIANS_UNLOCKED_KEY, 'true');
    } catch {
      // no-op
    }
  }
  setProgressionArtifactUpdatedAt('quest_runs', new Date().toISOString());
  publishQuestRunsSync('quest-run-service.closeRun');
}

export function getRuns(): QuestRun[] {
  return loadRuns();
}

export function getActiveRun(): QuestRun | null {
  const id = getActiveRunId();
  if (!id) return null;
  return getRun(id) ?? null;
}

export function getRun(runId: string): QuestRun | undefined {
  return loadRuns().find((r) => r.runId === runId);
}

export function isTemporalMeridiansUnlocked(): boolean {
  return isTemporalMeridiansUnlockedInternal();
}
