/**
 * ARCHÉ — Méridiens: localStorage for observations, visited thresholds, crossings.
 */

import type { ThresholdId } from '../data/meridiens';

const KEY_OBSERVATIONS = 'arche_meridien_observations_v1';
const KEY_VISITED = 'arche_meridien_thresholds_visited_v1';
const KEY_CROSSINGS = 'arche_meridien_crossings_v1';

export type ObservationRecord = { thresholdId: string; promptId: string; at: string };

export function getObservations(): ObservationRecord[] {
  try {
    const raw = localStorage.getItem(KEY_OBSERVATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markObservation(thresholdId: string, promptId: string): void {
  const list = getObservations();
  if (list.some((o) => o.thresholdId === thresholdId && o.promptId === promptId)) return;
  list.push({ thresholdId, promptId, at: new Date().toISOString() });
  localStorage.setItem(KEY_OBSERVATIONS, JSON.stringify(list));
}

export function hasObservation(thresholdId: string, promptId: string): boolean {
  return getObservations().some((o) => o.thresholdId === thresholdId && o.promptId === promptId);
}

export function getThresholdsVisited(): ThresholdId[] {
  try {
    const raw = localStorage.getItem(KEY_VISITED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markThresholdVisited(thresholdId: ThresholdId): void {
  const list = getThresholdsVisited();
  if (list.includes(thresholdId)) return;
  list.push(thresholdId);
  localStorage.setItem(KEY_VISITED, JSON.stringify(list));
}

export function getCrossings(): string[] {
  try {
    const raw = localStorage.getItem(KEY_CROSSINGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addCrossing(): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const list = getCrossings();
  if (list.includes(dateStr)) return;
  list.push(dateStr);
  localStorage.setItem(KEY_CROSSINGS, JSON.stringify(list));
}
