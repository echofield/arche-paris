/**
 * Territory resolution: lat/lon → zone (bbox containment).
 * Uses public.zones (zone_id, min_lat, max_lat, min_lng, max_lng, center_lat, center_lng).
 */

import type { getServiceClient } from "./supabase.ts";

export interface ZoneRow {
  zone_id: string;
  center_lat: number;
  center_lng: number;
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
}

/**
 * Resolve zone that contains the given point. If multiple zones overlap (e.g. test zones),
 * returns the one with smallest area.
 */
export async function resolveZoneByLatLon(
  supabase: ReturnType<typeof getServiceClient>,
  lat: number,
  lon: number
): Promise<ZoneRow | null> {
  const { data, error } = await supabase
    .from("zones")
    .select("zone_id, center_lat, center_lng, min_lat, max_lat, min_lng, max_lng")
    .eq("active", true)
    .lte("min_lat", lat)
    .gte("max_lat", lat)
    .lte("min_lng", lon)
    .gte("max_lng", lon);

  if (error || !data?.length) return null;

  const rows = data as ZoneRow[];
  if (rows.length === 1) return rows[0]!;

  // Smallest area first
  const withArea = rows.map((r) => ({
    row: r,
    area: (r.max_lat - r.min_lat) * (r.max_lng - r.min_lng),
  }));
  withArea.sort((a, b) => a.area - b.area);
  return withArea[0]!.row;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * When point is outside all zone bboxes (e.g. near edge), return nearest active zone by distance to center.
 * Lets the scan still return a valid reading instead of failing.
 */
export async function resolveNearestZoneByLatLon(
  supabase: ReturnType<typeof getServiceClient>,
  lat: number,
  lon: number
): Promise<ZoneRow | null> {
  const { data, error } = await supabase
    .from("zones")
    .select("zone_id, center_lat, center_lng, min_lat, max_lat, min_lng, max_lng")
    .eq("active", true);

  if (error || !data?.length) return null;

  const rows = data as ZoneRow[];
  let best: ZoneRow | null = null;
  let bestDist = Infinity;
  for (const r of rows) {
    const d = haversineM(lat, lon, r.center_lat, r.center_lng);
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best;
}
