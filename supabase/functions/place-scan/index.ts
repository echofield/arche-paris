/**
 * Instrument 02 — Lecture du Lieu (Place Scan)
 * POST { lat, lon, heading? } → PlaceScanResult (4 factual cards).
 * No tracking, no "who is here", no raw location trails; H3 + zone only.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireUserId } from "../_shared/auth.ts";
import { validateCoordsSanity } from "../_shared/validation.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { resolveZoneByLatLon, resolveNearestZoneByLatLon } from "../_shared/territory.ts";
import { safeLatLngToH3 } from "../_shared/h3.ts";

/** HMAC-SHA256(card_id, PLACE_SCAN_CARD_HASH_SECRET) as hex; returns null if secret missing or crypto fails. */
async function computeCardHash(cardId: string): Promise<string | null> {
  const secret = Deno.env.get("PLACE_SCAN_CARD_HASH_SECRET");
  if (!secret) return null;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(cardId));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

// ----- Types (contract) -----

type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
type DistanceQualifier = "here" | "near" | "a short walk" | "a walk";

export const PLACE_SCAN_RESULT_VERSION = 1;

export interface PlaceScanResult {
  version: number;
  zone_id: string;
  h3: string;
  cards: [
    { type: "landmark"; label: string; direction: Direction; distance: DistanceQualifier },
    { type: "cultural"; line: string },
    { type: "spatial"; identity: string },
    { type: "now"; state: NowState },
  ];
}

// ----- Zone anchors: one per arrondissement (locally grounded); then meridian fallback -----
const ZONE_ANCHORS: Record<string, { label: string; lat: number; lng: number }> = {
  "PAR-01": { label: "Louvre courtyard", lat: 48.86, lng: 2.335 },
  "PAR-02": { label: "Bourse", lat: 48.868, lng: 2.345 },
  "PAR-03": { label: "Marais", lat: 48.864, lng: 2.362 },
  "PAR-04": { label: "Hôtel de Ville", lat: 48.853, lng: 2.355 },
  "PAR-05": { label: "Panthéon", lat: 48.847, lng: 2.352 },
  "PAR-06": { label: "Saint-Sulpice", lat: 48.85, lng: 2.332 },
  "PAR-07": { label: "Palais Bourbon", lat: 48.856, lng: 2.308 },
  "PAR-08": { label: "Champs-Élysées", lat: 48.872, lng: 2.31 },
  "PAR-09": { label: "Opéra", lat: 48.876, lng: 2.338 },
  "PAR-10": { label: "Gare du Nord", lat: 48.875, lng: 2.362 },
  "PAR-11": { label: "Place de la République", lat: 48.86, lng: 2.382 },
  "PAR-12": { label: "Gare de Lyon", lat: 48.842, lng: 2.398 },
  "PAR-13": { label: "Gobelins", lat: 48.828, lng: 2.36 },
  "PAR-14": { label: "Observatoire", lat: 48.828, lng: 2.322 },
  "PAR-15": { label: "Vaugirard", lat: 48.842, lng: 2.29 },
  "PAR-16": { label: "Trocadéro", lat: 48.86, lng: 2.27 },
  "PAR-17": { label: "Batignolles", lat: 48.888, lng: 2.31 },
  "PAR-18": { label: "Sacré-Cœur", lat: 48.89, lng: 2.35 },
  "PAR-19": { label: "Buttes-Chaumont", lat: 48.888, lng: 2.39 },
  "PAR-20": { label: "Père Lachaise", lat: 48.865, lng: 2.405 },
};

const MERIDIAN_ANCHORS: Array<{ zone_id: string; label: string; lat: number; lng: number }> = [
  { zone_id: "PAR-01", label: "Arago Medallions", lat: 48.86, lng: 2.335 },
  { zone_id: "PAR-05", label: "Foucault Pendulum", lat: 48.847, lng: 2.352 },
  { zone_id: "PAR-06", label: "Saint-Sulpice Gnomon", lat: 48.85, lng: 2.332 },
  { zone_id: "PAR-14", label: "Salle Cassini", lat: 48.828, lng: 2.322 },
  { zone_id: "PAR-14", label: "Arago Pedestal", lat: 48.834, lng: 2.336 },
  { zone_id: "PAR-14", label: "Mire du Sud", lat: 48.822, lng: 2.338 },
  { zone_id: "PAR-18", label: "Fizeau Mirror Leg", lat: 48.89, lng: 2.35 },
];

// ----- Cultural: one factual line per zone -----
const CULTURAL_BY_ZONE: Record<string, string> = {
  "PAR-01": "The Paris meridian passes through the Louvre courtyard.",
  "PAR-02": "This district was shaped by the grands boulevards.",
  "PAR-03": "The Marais holds traces of the old Templar enclosure.",
  "PAR-04": "The Hôtel de Ville marks the civic heart of Paris.",
  "PAR-05": "The Panthéon and the Observatory define a scientific axis.",
  "PAR-06": "Saint-Sulpice church lies on the historic meridian line.",
  "PAR-07": "The Palais Bourbon aligns with the river and the axis.",
  "PAR-08": "The Champs-Élysées extend the great east–west axis.",
  "PAR-09": "Grands magasins and opera frame this quarter.",
  "PAR-10": "The Canal Saint-Martin and the Gare du Nord shape the north.",
  "PAR-11": "The Bastille and the République axis cross here.",
  "PAR-12": "The Bois de Vincennes and the Gare de Lyon anchor the east.",
  "PAR-13": "The Gobelins and the Bièvre valley mark this district.",
  "PAR-14": "The Paris Observatory established the meridian in 1667.",
  "PAR-15": "Vaugirard stretches toward the southwestern edge.",
  "PAR-16": "Passy and the Trocadéro face the river.",
  "PAR-17": "Batignolles and Monceau border the northern boulevards.",
  "PAR-18": "Montmartre and the Sacré-Cœur overlook the city.",
  "PAR-19": "The Buttes-Chaumont and the Canal de l'Ourcq define the northeast.",
  "PAR-20": "Ménilmontant and Père Lachaise lie to the east.",
};

// ----- Spatial identity (urban morphology) -----
const SPATIAL_BY_ZONE: Record<string, string> = {
  "PAR-01": "Axis",
  "PAR-02": "Quarter",
  "PAR-03": "Quarter",
  "PAR-04": "Axis",
  "PAR-05": "Threshold",
  "PAR-06": "Revelation",
  "PAR-07": "Axis",
  "PAR-08": "Axis",
  "PAR-09": "Quarter",
  "PAR-10": "Quarter",
  "PAR-11": "Quarter",
  "PAR-12": "Quarter",
  "PAR-13": "Quarter",
  "PAR-14": "Measurement",
  "PAR-15": "Quarter",
  "PAR-16": "Quarter",
  "PAR-17": "Quarter",
  "PAR-18": "Threshold",
  "PAR-19": "Quarter",
  "PAR-20": "Quarter",
};

// ----- Helpers -----

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function bearingDeg(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
  const dLon = ((toLon - fromLon) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((toLat * Math.PI) / 180);
  const x =
    Math.cos((fromLat * Math.PI) / 180) * Math.sin((toLat * Math.PI) / 180) -
    Math.sin((fromLat * Math.PI) / 180) * Math.cos((toLat * Math.PI) / 180) * Math.cos(dLon);
  let b = (Math.atan2(y, x) * 180) / Math.PI;
  if (b < 0) b += 360;
  return b;
}

function bearingToDirection(bearing: number): Direction {
  const i = Math.round(bearing / 45) % 8;
  const dirs: Direction[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[i] ?? "N";
}

function metersToDistanceQualifier(m: number, sameZone: boolean): DistanceQualifier {
  if (sameZone) return m < 150 ? "here" : "near";
  if (m < 250) return "near";
  if (m < 800) return "a short walk";
  return "a walk";
}

function getParisHour(): number {
  return Number.parseInt(
    new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", hour12: false, timeZone: "Europe/Paris" }).format(new Date()),
    10
  );
}

/** Stable vocabulary: opening (morning), active (day), transition (evening), quiet (night). */
type NowState = "opening" | "active" | "transition" | "quiet";

function nowState(parisHour: number): NowState {
  if (parisHour >= 6 && parisHour < 10) return "opening";
  if (parisHour >= 10 && parisHour < 18) return "active";
  if (parisHour >= 18 && parisHour < 22) return "transition";
  return "quiet";
}

function buildLandmarkCard(
  lat: number,
  lon: number,
  zone_id: string,
  zoneCenter: { lat: number; lng: number }
): { type: "landmark"; label: string; direction: Direction; distance: DistanceQualifier } {
  const zoneAnchor = ZONE_ANCHORS[zone_id];
  if (zoneAnchor) {
    const dir = bearingToDirection(bearingDeg(lat, lon, zoneAnchor.lat, zoneAnchor.lng));
    const distM = haversineM(lat, lon, zoneAnchor.lat, zoneAnchor.lng);
    const distance = metersToDistanceQualifier(distM, true);
    return { type: "landmark", label: zoneAnchor.label, direction: dir, distance };
  }
  let best = { anchor: MERIDIAN_ANCHORS[0]!, dist: Infinity, sameZone: false };
  for (const a of MERIDIAN_ANCHORS) {
    const dist = haversineM(lat, lon, a.lat, a.lng);
    const sameZone = a.zone_id === zone_id;
    if (dist < best.dist) best = { anchor: a, dist, sameZone };
  }
  const a = best.anchor;
  const dir = bearingToDirection(bearingDeg(lat, lon, a.lat, a.lng));
  const distance = metersToDistanceQualifier(best.dist, best.sameZone);
  return { type: "landmark", label: a.label, direction: dir, distance };
}

function buildCulturalCard(zone_id: string): { type: "cultural"; line: string } {
  const line = CULTURAL_BY_ZONE[zone_id] ?? "This district is part of the Paris meridian story.";
  return { type: "cultural", line };
}

function buildSpatialCard(zone_id: string): { type: "spatial"; identity: string } {
  const identity = SPATIAL_BY_ZONE[zone_id] ?? "Quarter";
  return { type: "spatial", identity };
}

function buildNowCard(): { type: "now"; state: NowState } {
  return { type: "now", state: nowState(getParisHour()) };
}

/** Fallback when no zone (containment + nearest) so we always return 200 after coords pass. */
function buildFallbackResult(lat: number, lon: number): PlaceScanResult {
  const h3Index = safeLatLngToH3(lat, lon, 9) ?? "PARIS";
  const nowStateVal = nowState(getParisHour());
  return {
    version: PLACE_SCAN_RESULT_VERSION,
    zone_id: "PARIS",
    h3: h3Index,
    cards: [
      { type: "landmark", label: "Paris", direction: "N", distance: "here" },
      { type: "cultural", line: "Edge of current map." },
      { type: "spatial", identity: "Threshold" },
      { type: "now", state: nowStateVal },
    ],
  };
}

// ----- Handler -----

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = await requireUserId(req, { allowCardSession: true });
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { lat?: number; lon?: number; heading?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const lat = body.lat;
  const lon = body.lon;
  const coordsResult = validateCoordsSanity(lat ?? null, lon ?? null);
  if (!coordsResult.valid) {
    return new Response(
      JSON.stringify({
        error: coordsResult.error!.message,
        code: coordsResult.error!.code,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabase = getServiceClient();
  let zone = await resolveZoneByLatLon(supabase, lat!, lon!);
  if (!zone) zone = await resolveNearestZoneByLatLon(supabase, lat!, lon!);

  let result: PlaceScanResult;
  let zoneId: string;
  let h3Index: string;
  let nowStateVal: NowState;

  if (!zone) {
    result = buildFallbackResult(lat!, lon!);
    zoneId = "PARIS";
    h3Index = result.h3;
    nowStateVal = result.cards[3].state;
  } else {
    zoneId = zone.zone_id;
    h3Index = safeLatLngToH3(lat!, lon!, 9) ?? zoneId;
    nowStateVal = nowState(getParisHour());
    const zoneCenter = { lat: zone.center_lat, lng: zone.center_lng };
    result = {
      version: PLACE_SCAN_RESULT_VERSION,
      zone_id: zoneId,
      h3: h3Index,
      cards: [
        buildLandmarkCard(lat!, lon!, zoneId, zoneCenter),
        buildCulturalCard(zoneId),
        buildSpatialCard(zoneId),
        buildNowCard(),
      ],
    };
  }

  const cardId = typeof auth.userId === "string" && auth.userId.startsWith("card:") ? auth.userId.slice(5) : null;
  if (cardId) {
    const cardHash = await computeCardHash(cardId);
    if (cardHash) {
      const cooldownSince = new Date(Date.now() - 2000).toISOString();
      const { data: recent } = await supabase
        .from("place_scan_events")
        .select("id")
        .eq("card_hash", cardHash)
        .gte("created_at", cooldownSince)
        .limit(1)
        .maybeSingle();
      if (!recent) {
        const heading = body.heading;
        const headingBucket =
          typeof heading === "number" && !Number.isNaN(heading) ? Math.min(35, Math.max(0, Math.floor(heading / 10))) : null;
        await supabase.from("place_scan_events").insert({
          card_hash: cardHash,
          zone_id: zoneId,
          h3: h3Index,
          time_bucket: nowStateVal,
          heading_bucket: headingBucket,
        });
      }
    }
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
