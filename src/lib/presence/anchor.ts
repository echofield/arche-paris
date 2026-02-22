/**
 * ARCHÉ — Presence anchor: short-lived continuity (do not rescue garbage).
 * Store only on ok && grade === 'HIGH'. Expires after 2 minutes.
 */

import type { PresenceGrade } from './index';

const STORAGE_KEY = 'arche_presence_anchor_v1';
const EXPIRE_MS = 2 * 60 * 1000;

export type Anchor = {
  lat: number;
  lng: number;
  ts: number;
  grade: PresenceGrade;
};

export function readAnchor(): Anchor | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Anchor;
    if (
      typeof a?.lat !== 'number' ||
      typeof a?.lng !== 'number' ||
      typeof a?.ts !== 'number' ||
      a.grade !== 'HIGH'
    )
      return null;
    if (Date.now() - a.ts > EXPIRE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return a;
  } catch {
    return null;
  }
}

export function writeAnchor(anchor: Anchor): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (anchor.grade !== 'HIGH') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(anchor));
  } catch {
    /* ignore */
  }
}

export function clearAnchor(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
