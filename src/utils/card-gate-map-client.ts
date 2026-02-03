/**
 * ARCHÉ — Card Gate map client (inscriptions, proofs, segments, map-state).
 * All writes go through Card Gate; client never writes directly to Supabase.
 */

import { getCardGateBaseUrl, getCardToken } from "./card-gate-client";
import type { MapState, MapInscription, EngravedSegment, MeridianProof } from "../types/map-engraving";

async function gateMapFetch(
  cardId: string,
  path: string,
  options: { method?: string; body?: string } = {}
): Promise<Response> {
  const base = getCardGateBaseUrl();
  if (!base) throw new Error("Card Gate URL not configured");
  const token = await getCardToken(cardId);
  return fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body,
  });
}

export interface PostInscriptionPayload {
  kind: "arrondissement" | "quest" | "lieu";
  arrondissement?: number;
  anchor_id?: string;
  text: string;
  idempotency_key?: string;
}

export async function postInscription(cardId: string, payload: PostInscriptionPayload): Promise<{ ok: boolean; id?: string; created_at?: string }> {
  const res = await gateMapFetch(cardId, "/inscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Inscription failed: ${res.status}`);
  return { ok: true, id: data?.id, created_at: data?.created_at };
}

export interface PostMeridianProofPayload {
  meridian_id: string;
  approx: { lat: number; lng: number; radius_m: number };
  answer: string;
  personal_sentence: string;
}

export async function postMeridianProof(cardId: string, payload: PostMeridianProofPayload): Promise<{ ok: boolean; id?: string; created_at?: string }> {
  const res = await gateMapFetch(cardId, "/proofs/meridiens", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Meridian proof failed: ${res.status}`);
  return { ok: true, id: data?.id, created_at: data?.created_at };
}

export interface PostMarcheProofPayload {
  link_or_text?: string;
  from?: { arrondissement?: number; lat?: number; lng?: number };
  to?: { arrondissement?: number; lat?: number; lng?: number };
}

export async function postMarcheProof(cardId: string, payload: PostMarcheProofPayload): Promise<{ ok: boolean }> {
  const res = await gateMapFetch(cardId, "/proofs/marches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Marche proof failed: ${res.status}`);
  return { ok: true };
}

export interface PostSegmentPayload {
  kind: "marche" | "meridien" | "tresor";
  from?: { arrondissement?: number; anchor_id?: string; lat?: number; lng?: number };
  to?: { arrondissement?: number; anchor_id?: string; lat?: number; lng?: number };
  idempotency_key?: string;
}

export async function postSegment(cardId: string, payload: PostSegmentPayload): Promise<{ ok: boolean }> {
  const res = await gateMapFetch(cardId, "/segments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Segment failed: ${res.status}`);
  return { ok: true };
}

export async function getMapState(cardId: string): Promise<MapState> {
  const res = await gateMapFetch(cardId, "/map-state");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Map state failed: ${res.status}`);
  return {
    inscriptions: (data?.inscriptions ?? []) as MapInscription[],
    segments: (data?.segments ?? []) as EngravedSegment[],
    meridian_proofs: (data?.meridian_proofs ?? []) as MeridianProof[],
  };
}
