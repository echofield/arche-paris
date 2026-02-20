/**
 * ARCHÉ — Shared territory utilities.
 * Single source of truth for Paris bounds and arrondissement-from-geo inference.
 * No arrondissement inference in screen components; all calls go through this util.
 */

import { project } from './map-project';
import { ARRONDISSEMENT_MAP_POSITION } from '@/data/arrondissement-positions';

const MAP_VIEWBOX_WIDTH = 2037.566;
const MAP_VIEWBOX_HEIGHT = 1615.5;

export const PARIS_TERRITORY_BOUNDS = {
  minLat: 48.815,
  maxLat: 48.902,
  minLng: 2.224,
  maxLng: 2.422,
} as const;

export function isInsideParisTerritory(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return (
    lat >= PARIS_TERRITORY_BOUNDS.minLat &&
    lat <= PARIS_TERRITORY_BOUNDS.maxLat &&
    lng >= PARIS_TERRITORY_BOUNDS.minLng &&
    lng <= PARIS_TERRITORY_BOUNDS.maxLng
  );
}

/**
 * Infer Paris arrondissement (1–20) from lat/lng using map projection and nearest center.
 * Returns null if outside Paris or invalid.
 */
export function inferArrondissementFromGeo(lat: number, lng: number): number | null {
  if (!isInsideParisTerritory(lat, lng)) return null;
  const p = project(lat, lng);
  const xPct = (p.x / MAP_VIEWBOX_WIDTH) * 100;
  const yPct = (p.y / MAP_VIEWBOX_HEIGHT) * 100;
  if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return null;
  if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return null;

  let bestArr: number | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let arr = 1; arr <= 20; arr++) {
    const center = ARRONDISSEMENT_MAP_POSITION[arr];
    if (!center) continue;
    const dx = center.x - xPct;
    const dy = center.y - yPct;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist) {
      bestDist = d;
      bestArr = arr;
    }
  }
  return bestArr;
}

/** Format arrondissement number as PAR-XX zone id. */
export function zoneIdFromArrondissement(arr: number): string {
  return `PAR-${String(arr).padStart(2, '0')}`;
}
