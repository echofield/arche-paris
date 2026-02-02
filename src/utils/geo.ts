/**
 * ARCHÉ — Geo utils for Compass (Trésor Caché).
 * No coordinates stored. Used only while Compass is active, in foreground.
 */

const R = 6371000; // Earth radius in meters

/**
 * Distance between two points in meters (Haversine).
 */
export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Bearing from A to B in degrees (0 = North, 90 = East).
 */
export function bearingDegrees(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x = Math.sin(dLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(x, y) * 180) / Math.PI;
  return normalizeDegrees(bearing);
}

/**
 * Normalize angle to 0–360.
 */
export function normalizeDegrees(d: number): number {
  let n = d % 360;
  if (n < 0) n += 360;
  return n;
}
