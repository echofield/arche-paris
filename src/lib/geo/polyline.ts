/**
 * Polyline geo helpers for Meridian axis lock.
 * Equirectangular local meters around Paris; point-to-segment distance; bearing.
 */

import { bearingDegrees } from '../../utils/geo';

const LAT0 = (48.8566 * Math.PI) / 180;
const LNG0 = (2.3522 * Math.PI) / 180;
const R = 6371000;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocalMeters {
  x: number;
  y: number;
}

/** Convert lat/lng to local meters (equirectangular) around Paris center. */
export function toLocalMeters(point: LatLng): LocalMeters {
  const latRad = (point.lat * Math.PI) / 180;
  const lngRad = (point.lng * Math.PI) / 180;
  const x = R * (lngRad - LNG0) * Math.cos(LAT0);
  const y = R * (latRad - LAT0);
  return { x, y };
}

/** Squared distance from point to segment (in 2D local meters). */
function distSqPointToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const qx = px - ax;
    const qy = py - ay;
    return qx * qx + qy * qy;
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx - px;
  const qy = ay + t * dy - py;
  return qx * qx + qy * qy;
}

/** Distance from point to polyline in meters (nearest segment). */
export function distancePointToPolylineMeters(
  point: LatLng,
  polyline: LatLng[]
): number {
  if (polyline.length < 2) {
    if (polyline.length === 1) {
      const p = toLocalMeters(point);
      const a = toLocalMeters(polyline[0]);
      return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
    }
    return Infinity;
  }
  const pm = toLocalMeters(point);
  let minDistSq = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const am = toLocalMeters(polyline[i]);
    const bm = toLocalMeters(polyline[i + 1]);
    const dSq = distSqPointToSegment(pm.x, pm.y, am.x, am.y, bm.x, bm.y);
    if (dSq < minDistSq) minDistSq = dSq;
  }
  return Math.sqrt(minDistSq);
}

/** Bearing of the segment nearest to point (0–360 deg). */
export function nearestSegmentBearingDeg(point: LatLng, polyline: LatLng[]): number {
  if (polyline.length < 2) return 0;
  const pm = toLocalMeters(point);
  let minDistSq = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const am = toLocalMeters(polyline[i]);
    const bm = toLocalMeters(polyline[i + 1]);
    const dSq = distSqPointToSegment(pm.x, pm.y, am.x, am.y, bm.x, bm.y);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      bestIdx = i;
    }
  }
  const a = polyline[bestIdx];
  const b = polyline[bestIdx + 1];
  return bearingDegrees(a.lat, a.lng, b.lat, b.lng);
}

/** Smallest angle between two bearings in degrees (0..180). */
export function angleDiffDeg(a: number, b: number): number {
  let d = Math.abs(((a - b) % 360 + 360) % 360);
  if (d > 180) d = 360 - d;
  return d;
}
