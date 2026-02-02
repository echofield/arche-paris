/**
 * ARCHÉ — My Paris trace service (local only)
 * Legacy: arche_traces (QuestTrace). v1: arche_traces_v1 (QuestThreadTrace).
 */

import type { QuestTrace, QuestThreadTrace } from '../types/traces';

const STORAGE_KEY = 'arche_traces';
const STORAGE_KEY_V1 = 'arche_traces_v1';

function loadLegacyTraces(): QuestTrace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTraces(traces: QuestTrace[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(traces));
  } catch (e) {
    console.warn('trace-service: save failed', e);
  }
}

export function addQuestTrace(trace: QuestTrace): void {
  const traces = loadLegacyTraces();
  traces.push(trace);
  saveTraces(traces);
}

export function listTraces(): QuestTrace[] {
  return loadLegacyTraces();
}

// --- v1 (QuestThreadTrace) ---

function loadTracesV1Raw(): QuestThreadTrace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTracesV1(traces: QuestThreadTrace[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(traces));
  } catch (e) {
    console.warn('trace-service: save v1 failed', e);
  }
}

export function loadTracesV1(): QuestThreadTrace[] {
  return loadTracesV1Raw();
}

export function addOrUpdateQuestTraceV1(trace: QuestThreadTrace): void {
  const traces = loadTracesV1Raw();
  const idx = traces.findIndex((t) => t.traceId === trace.traceId);
  if (idx >= 0) traces[idx] = trace;
  else traces.push(trace);
  saveTracesV1(traces);
}

export function getTracesForQuestV1(questId: string): QuestThreadTrace[] {
  return loadTracesV1Raw().filter((t) => t.questId === questId);
}
