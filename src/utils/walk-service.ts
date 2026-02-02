/**
 * ARCHÉ — Walk log (local only)
 * Daily km only from explicit quest closes + manual entries. No tracking.
 */

import type { WalkDay, WalkEntry } from '../types/walk';

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

function loadWalkLog(): Record<string, WalkDay> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
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

export function addQuestWalk(
  date: string,
  questTitle: string,
  questId: string,
  approxKm?: number
): void {
  const log = loadWalkLog();
  const day = log[date] ?? { date, approxKm: 0, entries: [] };
  const entry: WalkEntry = {
    kind: 'quest',
    label: questTitle,
    at: new Date().toISOString(),
    approxKm,
    questId
  };
  day.entries.push(entry);
  day.approxKm = day.entries.reduce((sum, e) => sum + (e.approxKm ?? 0), 0);
  log[date] = day;
  saveWalkLog(log);
}

export function addManualWalk(
  date: string,
  label: string,
  approxKm?: number,
  minutes?: number
): void {
  const log = loadWalkLog();
  const day = log[date] ?? { date, approxKm: 0, entries: [] };
  const entry: WalkEntry = {
    kind: 'manual',
    label,
    at: new Date().toISOString(),
    approxKm,
    minutes
  };
  day.entries.push(entry);
  day.approxKm = day.entries.reduce((sum, e) => sum + (e.approxKm ?? 0), 0);
  log[date] = day;
  saveWalkLog(log);
}

export function getTodaySummary(): { approxKm: number; entries: WalkEntry[] } {
  const key = getTodayKey();
  const log = loadWalkLog();
  const day = log[key];
  if (!day) return { approxKm: 0, entries: [] };
  return {
    approxKm: day.approxKm,
    entries: [...day.entries]
  };
}

/** Parse distance string (e.g. "~2 km", "1.5 km") for approx km when quest has no approxKm. */
export function parseApproxKmFromDistance(distance: string | undefined): number | undefined {
  if (!distance || typeof distance !== 'string') return undefined;
  const match = distance.match(/(\d+(?:[.,]\d+)?)\s*km/i);
  if (!match) return undefined;
  const n = parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}
