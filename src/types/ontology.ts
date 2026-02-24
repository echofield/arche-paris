/**
 * ARCHÉ — Ontological types for MyMap layers.
 *
 * GPS is a soft signal for territory detection only.
 * Coordinates never surface to UI; only arrondissement identity does.
 * Precision belongs exclusively to NFC inscriptions.
 */

/** Tab A: live ephemeral territory state */
export interface PresenceState {
  arrondissement: string | null;
  signalQuality: 'locked' | 'warming' | 'weak' | 'idle';
  accuracyM: number | null;
  updatedAt: number;
}

/** Tab B: NFC-sealed proof entry (the ledger) */
export interface InscriptionEvent {
  id: string;
  nfcTagId: string;
  placeId: string;
  placeName: string;
  zoneId: string;
  timestamp: string;
  proof: InscriptionProof;
  text?: string;
}

export interface InscriptionProof {
  method: 'nfc';
  tagSignature: string;
  deviceTimestamp: string;
  serverConfirmedAt: string | null;
}

/** Migration: existing data without NFC */
export interface UnsealedTrace {
  id: string;
  kind: 'symbol' | 'segment' | 'quest_thread' | 'text_inscription';
  placeId?: string;
  zoneName?: string;
  timestamp: string;
  label: string;
}

/** Tab C: derived relationships between inscriptions */
export interface ConstellationNode {
  inscriptionId: string;
  placeId: string;
  placeName: string;
  position: { x: number; y: number };
  timestamp: string;
}

export interface ConstellationEdge {
  from: string;
  to: string;
  kind: 'temporal' | 'spatial' | 'thematic';
  label?: string;
  weight: number;
}

export interface ConstellationGraph {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  paths: ConstellationPath[];
}

export interface ConstellationPath {
  nodeIds: string[];
  label: string;
  formedAt: string;
}
