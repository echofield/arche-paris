/**
 * Server-side presence zone registry for TresorCache symbols.
 * zoneId -> { lat, lng, radiusM }. No client-injected coordinates in prod.
 */

export type PresenceZone = {
  lat: number;
  lng: number;
  radiusM: number;
};

const TRESOR_ZONES: Record<string, PresenceZone> = {
  "sym-18-dalida": { lat: 48.8865, lng: 2.3397, radiusM: 100 },
  "sym-18-passe-muraille": { lat: 48.8876, lng: 2.3382, radiusM: 100 },
  "sym-18-vigne": { lat: 48.8876, lng: 2.3408, radiusM: 100 },
  "sym-18-jeteaime": { lat: 48.8843, lng: 2.3385, radiusM: 100 },
};

export function getPresenceZone(zoneId: string): PresenceZone | null {
  return TRESOR_ZONES[zoneId] ?? null;
}

/** Only accept client-injected zone when DEBUG_PRESENCE is true (prod-safe). */
export function presenceAllowZoneFromBody(
  body: { zone?: unknown; zoneId?: string },
  debugPresence: boolean
): boolean {
  if (!body.zone) return true;
  return debugPresence === true;
}
