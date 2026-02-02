/**
 * ARCHÉ — Season from date (northern hemisphere).
 * Used for Seasonal Inscriptions (The Return).
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export function getSeason(date: Date): Season {
  const m = date.getMonth() + 1; // 1–12
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

export function isSameSeason(d1: Date, d2: Date): boolean {
  return getSeason(d1) === getSeason(d2);
}
