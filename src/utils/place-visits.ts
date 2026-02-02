/**
 * ARCHÉ — Last visit date and season per place (artifact or lieu).
 * Used for Seasonal Inscriptions (The Return). No notification.
 */

import { getSeason, type Season } from './season';

const STORAGE_KEY = 'arche_place_visits_v1';

export interface PlaceVisit {
  lastVisit: string; // ISO date
  season: Season;
}

function load(): Record<string, PlaceVisit> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function save(data: Record<string, PlaceVisit>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('place-visits: save failed', e);
  }
}

export function getPlaceVisit(placeId: string): PlaceVisit | null {
  return load()[placeId] ?? null;
}

export function recordPlaceVisit(placeId: string): void {
  const now = new Date();
  const data = load();
  data[placeId] = {
    lastVisit: now.toISOString(),
    season: getSeason(now)
  };
  save(data);
}

/** True if place was visited in a different season than now. */
export function hasReturnedInNewSeason(placeId: string): boolean {
  const visit = getPlaceVisit(placeId);
  if (!visit) return false;
  const then = new Date(visit.lastVisit);
  const now = new Date();
  return visit.season !== getSeason(now);
}

/** True if place has been visited at least once (claimed). */
export function isPlaceClaimed(placeId: string): boolean {
  return getPlaceVisit(placeId) != null;
}
