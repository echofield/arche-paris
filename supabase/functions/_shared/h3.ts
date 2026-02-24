/**
 * Minimal H3 util: lat/lon → H3 cell index at a given resolution.
 * Privacy-safe: use resolution 9 (~174m) so stored indices are coarse.
 * If h3-js fails at bundle/runtime, returns null so caller can use zone_id.
 */

import { latLngToCell } from "npm:h3-js@4";

const DEFAULT_RES = 9;

/**
 * Convert (lat, lon) to H3 cell index string. Returns null on any error so caller can use zone_id.
 * @param res Resolution 0–15; default 9 (~174m edge).
 */
export function safeLatLngToH3(lat: number, lng: number, res: number = DEFAULT_RES): string | null {
  try {
    const r = Math.max(0, Math.min(15, Math.floor(res)));
    return latLngToCell(lat, lng, r);
  } catch {
    return null;
  }
}
