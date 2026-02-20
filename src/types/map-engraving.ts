/**
 * ARCHÉ — Map v1 engraving types (Card Gate only).
 * Inscriptions, engraved segments, meridian proofs. Client creates status='pending' only.
 */

export type InscriptionKind = "arrondissement" | "quest" | "lieu";
export type VerifyStatus = "pending" | "verified";

export interface MapInscription {
  id: string;
  kind: InscriptionKind;
  status: VerifyStatus;
  arrondissement?: number;
  anchorId?: string;
  text: string;
  createdAt: string;
  readonly immutable: true;
}

export type SegmentKind = "marche" | "meridien" | "tresor";

export interface SegmentPoint {
  arrondissement?: number;
  anchorId?: string;
  lat?: number;
  lng?: number;
}

export interface EngravedSegment {
  id: string;
  kind: SegmentKind;
  status: VerifyStatus;
  from: SegmentPoint;
  to: SegmentPoint;
  createdAt: string;
}

export interface MeridianProof {
  id: string;
  meridianId: string;
  approx: { lat: number; lng: number; radiusM: number };
  answer: string;
  personalSentence: string;
  createdAt: string;
  status: VerifyStatus;
}

export interface MapState {
  inscriptions: MapInscription[];
  segments: EngravedSegment[];
  meridian_proofs: MeridianProof[];
}

export interface CityArrondissementSignal {
  arrondissement: number;
  signalStrength: number; // 0..1
  inscriptionCount: number;
  verifiedInscriptions: number;
  pendingInscriptions: number;
  segmentCount: number;
  lastActivityAt: string | null;
  sampleLines: string[];
}

export interface CityMapState {
  generatedAt: string;
  windowDays: number;
  arrondissements: CityArrondissementSignal[];
}
