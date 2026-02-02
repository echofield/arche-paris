/**
 * ARCHÉ — Quest run service (localStorage only)
 * Keys: arche_quest_runs, arche_active_run, arche_temporal_meridians_unlocked
 */

import type { QuestRun } from '../types/quest-run';

const RUNS_KEY = 'arche_quest_runs';
const ACTIVE_RUN_KEY = 'arche_active_run';
const TEMPORAL_MERIDIANS_UNLOCKED_KEY = 'arche_temporal_meridians_unlocked';

function loadRuns(): QuestRun[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
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

export function startRun(questId: string): QuestRun {
  const runs = loadRuns();
  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const run: QuestRun = {
    runId,
    questId,
    startedAt: new Date().toISOString(),
    visited: {}
  };
  runs.push(run);
  saveRuns(runs);
  setActiveRunId(runId);
  return run;
}

export function stampNode(
  runId: string,
  nodeId: string,
  evidenceLocalIds?: string[]
): void {
  const runs = loadRuns();
  const run = runs.find((r) => r.runId === runId);
  if (!run) return;
  run.visited[nodeId] = {
    at: new Date().toISOString(),
    evidenceLocalIds
  };
  saveRuns(runs);
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
    } catch {}
  }
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
  try {
    return localStorage.getItem(TEMPORAL_MERIDIANS_UNLOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}
