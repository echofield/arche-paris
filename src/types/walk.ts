/**
 * ARCHÉ — Walk log (Fade-safe, local)
 * Daily km only from explicit quest closes + manual entries. No tracking.
 */

export type WalkEntryKind = 'quest' | 'manual';

export interface WalkEntry {
  kind: WalkEntryKind;
  label: string;
  at: string; // ISO
  approxKm?: number;
  minutes?: number;
  questId?: string;
}

export interface WalkDay {
  date: string; // YYYY-MM-DD
  approxKm: number;
  entries: WalkEntry[];
}
