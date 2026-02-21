/**
 * ARCHÉ — Meridian instrument config (backend only).
 * Canonical thresholds and places for alignment state derivation.
 * Aligned with src/utils/meridien-geo.ts and src/data/meridiens.ts.
 */

export type MeridianPlaceId = "saint-sulpice" | "horloge" | "point-zero";

export type MeridianPlace = {
  id: MeridianPlaceId;
  label: string;
  lat: number;
  lng: number;
  radiusM: number;
};

export type MeridianConfig = {
  meridianLng: number;
  places: MeridianPlace[];
  thresholds: {
    lostM: number;
    nearMinM: number;
    nearMaxM: number;
    onLineMinM: number;
    onLineMaxM: number;
    alignedHeadingDeg: number;
    minSpeedMps: number;
    emaAlpha: number;
    holdSeconds: number;
  };
};

const PLACES: MeridianPlace[] = [
  { id: "saint-sulpice", label: "Saint-Sulpice", lat: 48.8512, lng: 2.3347, radiusM: 50 },
  { id: "horloge", label: "Tour de l'Horloge", lat: 48.8534, lng: 2.3462, radiusM: 30 },
  { id: "point-zero", label: "Point Zéro", lat: 48.8534, lng: 2.3488, radiusM: 20 },
];

/** Paris meridian longitude (approx.). Matches src/utils/meridien-geo.ts MERIDIAN_LNG. */
const MERIDIAN_LNG = 2.3372;

/** Default config: lost >100m, near 30–100m, on_line 10–30m, aligned ±20°. */
export function getMeridianConfig(): MeridianConfig {
  return {
    meridianLng: MERIDIAN_LNG,
    places: PLACES,
    thresholds: {
      lostM: 100,
      nearMinM: 30,
      nearMaxM: 100,
      onLineMinM: 10,
      onLineMaxM: 30,
      alignedHeadingDeg: 20,
      minSpeedMps: 0.1,
      emaAlpha: 0.2,
      holdSeconds: 3,
    },
  };
}
