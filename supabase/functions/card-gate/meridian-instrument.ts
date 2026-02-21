/**
 * ARCHÉ — Meridian instrument: alignment index and state from position/heading.
 * Signal-sized outputs only; no metrics in production unless debug.
 */

import type { MeridianConfig, MeridianPlaceId } from "./meridians-config.ts";
import { getMeridianConfig } from "./meridians-config.ts";

export type MeridianState = "EGARE" | "PROCHE" | "SUR_LIGNE" | "ALIGNE";

export type MeridianInstrument = {
  zoneId: string | null;
  state: MeridianState;
  recognized: { placeId: MeridianPlaceId; status: "RECONNU" | "NON_RECONNU" }[];
  nearestPlaceId: MeridianPlaceId | null;
  alignmentIndex: number;
  lineDistanceM: number | null;
  headingErrorDeg: number | null;
  holdProgress01: number;
  micro: {
    statusLine: string;
    hintLine?: string;
    tone?: "CALM" | "PRECISE";
  };
  /** For backend persistence only (meridian_hold). Not sent to client. */
  persistedHold?: { accumulatedHoldSeconds: number; lastAlignableAt: string | null };
};

const MAX_MICRO_LENGTH = 140;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Haversine distance in meters (no deps). */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Distance from position to meridian line (constant longitude) in meters.
 * Local planar approximation valid at city scale.
 */
function distanceToMeridianMeters(lat: number, lng: number, meridianLng: number): number {
  const dLng = Math.abs(lng - meridianLng);
  const latRad = (lat * Math.PI) / 180;
  const metersPerDegLng = 111320 * Math.cos(latRad);
  return dLng * metersPerDegLng;
}

/** Circular difference in degrees (0..180). */
function circularDiffDeg(a: number, b: number): number {
  let d = Math.abs(((a - b) % 360) + 360) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

/** Heading error vs N/S: min distance to 0° or 180°. */
function headingErrorDeg(heading: number): number {
  const errN = circularDiffDeg(heading, 0);
  const errS = circularDiffDeg(heading, 180);
  return Math.min(errN, errS);
}

function toSignalLine(s: string): string {
  const oneLine = s.replace(/\s+/g, " ").replace(/\n/g, " ").trim();
  if (oneLine.length <= MAX_MICRO_LENGTH) return oneLine;
  return oneLine.slice(0, MAX_MICRO_LENGTH).trim();
}

const MICRO_FR: Record<MeridianState, string> = {
  EGARE: "La ligne n'est pas perceptible encore.",
  PROCHE: "Quelque chose commence à s'aligner.",
  SUR_LIGNE: "L'axe tient sous tes pas.",
  ALIGNE: "Alignement tenu.",
};

const MICRO_EN: Record<MeridianState, string> = {
  EGARE: "The line is not perceptible yet.",
  PROCHE: "Something begins to align.",
  SUR_LIGNE: "The axis holds under your steps.",
  ALIGNE: "Alignment held.",
};

const PLACE_RECOGNIZED_FR = "Le lieu reconnaît ta présence.";
const PLACE_RECOGNIZED_EN = "The place recognizes your presence.";

const NO_POSITION_FR = "La ligne n'est pas perceptible encore.";
const NO_POSITION_EN = "The line is not perceptible yet.";

function isFR(acceptLanguage: string | undefined): boolean {
  if (!acceptLanguage) return false;
  return acceptLanguage.toLowerCase().includes("fr");
}

export type ComputeMeridianInput = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp?: string;
  zoneId: string | null;
  /** Persisted: ever recognized place ids for this card. */
  recognizedPlaceIds: MeridianPlaceId[];
  /** Currently in radius (for this request). */
  inRadiusPlaceIds: MeridianPlaceId[];
  prevAlignmentIndex?: number;
  /** Persisted hold state (meridian_hold). ALIGNE only when accumulated >= holdSeconds. */
  prevHold?: { accumulatedHoldSeconds: number; lastAlignableAt: string | null };
  debug?: boolean;
  acceptLanguage?: string;
};

/**
 * Compute meridian instrument from position and optional heading/speed.
 * Deterministic given inputs; EMA uses prevAlignmentIndex when provided.
 */
export function computeMeridianInstrument(input: ComputeMeridianInput): MeridianInstrument {
  const config = getMeridianConfig();
  const { thresholds, places, meridianLng } = config;
  const {
    lat,
    lng,
    heading,
    zoneId,
    recognizedPlaceIds,
    inRadiusPlaceIds,
    prevAlignmentIndex = 0,
    prevHold,
    debug = false,
    acceptLanguage,
  } = input;
  const holdSeconds = thresholds.holdSeconds;

  // Local planar approximation valid at city scale.
  const lineDistanceM = distanceToMeridianMeters(lat, lng, meridianLng);
  const headErr = heading !== undefined ? headingErrorDeg(heading) : null;

  // State bands: EGARE | PROCHE | SUR_LIGNE only here. ALIGNE only after hold (below).
  let state: MeridianState;
  if (lineDistanceM > thresholds.lostM) {
    state = "EGARE";
  } else if (lineDistanceM > thresholds.onLineMaxM) {
    state = "PROCHE";
  } else {
    state = "SUR_LIGNE";
  }
  const alignable =
    state === "SUR_LIGNE" &&
    headErr !== null &&
    headErr <= thresholds.alignedHeadingDeg;

  // AlignmentIndex: precision only near the line (p from onLineMaxM).
  // Alternative "axis proximity across whole approach" would be p = 1 - d/lostM.
  const p = clamp01(1 - lineDistanceM / thresholds.onLineMaxM);
  const h =
    headErr !== null
      ? clamp01(1 - headErr / thresholds.alignedHeadingDeg)
      : 0;
  const speed = input.speed;
  const m = speed != null ? clamp01(speed / thresholds.minSpeedMps) : 1;
  const raw = 0.55 * p + 0.35 * h + 0.1 * m;
  const alignmentIndex = thresholds.emaAlpha * raw + (1 - thresholds.emaAlpha) * prevAlignmentIndex;

  // Hold: ALIGNE only when alignment held for holdSeconds (persisted across requests).
  let holdProgress01: number;
  let persistedHold: { accumulatedHoldSeconds: number; lastAlignableAt: string | null };
  const nowIso = input.timestamp ?? new Date().toISOString();
  const nowSec = new Date(nowIso).getTime() / 1000;

  if (alignable) {
    const lastSec = prevHold?.lastAlignableAt
      ? new Date(prevHold.lastAlignableAt).getTime() / 1000
      : null;
    const prevAcc = prevHold?.accumulatedHoldSeconds ?? 0;
    const elapsed = lastSec !== null ? Math.max(0, nowSec - lastSec) : 0;
    const add = Math.min(elapsed, Math.max(0, holdSeconds - prevAcc));
    const accumulated = Math.min(holdSeconds, prevAcc + add);
    persistedHold = {
      accumulatedHoldSeconds: accumulated,
      lastAlignableAt: nowIso,
    };
    if (accumulated >= holdSeconds) {
      state = "ALIGNE";
      holdProgress01 = 1;
    } else {
      holdProgress01 = clamp01(accumulated / holdSeconds);
    }
  } else {
    persistedHold = { accumulatedHoldSeconds: 0, lastAlignableAt: null };
    holdProgress01 = 0;
  }

  // Recognized: RECONNU if ever persisted (or currently in radius and we will persist).
  const recognized = places.map((place) => {
    const status =
      recognizedPlaceIds.includes(place.id) || inRadiusPlaceIds.includes(place.id)
        ? "RECONNU"
        : "NON_RECONNU";
    return { placeId: place.id, status };
  });

  // Nearest place (smallest distance among places).
  let nearestPlaceId: MeridianPlaceId | null = null;
  let minD = Infinity;
  for (const place of places) {
    const d = haversineMeters(lat, lng, place.lat, place.lng);
    if (d < minD) {
      minD = d;
      nearestPlaceId = place.id;
    }
  }

  const langFR = isFR(acceptLanguage);
  const statusLine = toSignalLine(
    langFR ? MICRO_FR[state] : MICRO_EN[state]
  );
  const anyRecognized = recognized.some((r) => r.status === "RECONNU");
  const hintLine =
    anyRecognized
      ? toSignalLine(langFR ? PLACE_RECOGNIZED_FR : PLACE_RECOGNIZED_EN)
      : undefined;

  const micro: MeridianInstrument["micro"] = {
    statusLine,
    ...(hintLine ? { hintLine } : {}),
    tone: state === "ALIGNE" ? "PRECISE" : "CALM",
  };

  const out: MeridianInstrument = {
    zoneId,
    state,
    recognized,
    nearestPlaceId,
    alignmentIndex: Math.max(0, Math.min(1, alignmentIndex)),
    lineDistanceM: debug ? lineDistanceM : null,
    headingErrorDeg: debug && headErr !== null ? headErr : null,
    holdProgress01,
    micro,
    persistedHold,
  };
  return out;
}

/**
 * Default instrument when no position: EGARE, all NON_RECONNU (or from persisted only).
 */
export function defaultMeridianInstrument(option: {
  zoneId: string | null;
  recognizedPlaceIds: MeridianPlaceId[];
  acceptLanguage?: string;
}): MeridianInstrument {
  const config = getMeridianConfig();
  const langFR = isFR(option.acceptLanguage);
  const statusLine = toSignalLine(
    langFR ? NO_POSITION_FR : NO_POSITION_EN
  );
  return {
    zoneId: option.zoneId,
    state: "EGARE",
    recognized: config.places.map((p) => ({
      placeId: p.id,
      status: option.recognizedPlaceIds.includes(p.id) ? "RECONNU" : "NON_RECONNU",
    })),
    nearestPlaceId: null,
    alignmentIndex: 0,
    lineDistanceM: null,
    headingErrorDeg: null,
    holdProgress01: 0,
    micro: { statusLine, tone: "CALM" },
  };
}

/**
 * Which places are currently in radius (haversine <= radiusM).
 */
export function placesInRadius(
  lat: number,
  lng: number,
  config: MeridianConfig
): MeridianPlaceId[] {
  const out: MeridianPlaceId[] = [];
  for (const place of config.places) {
    if (haversineMeters(lat, lng, place.lat, place.lng) <= place.radiusM) {
      out.push(place.id);
    }
  }
  return out;
}
