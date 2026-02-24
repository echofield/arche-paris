/**
 * ARCHÉ Card Types
 * Internal world objects — not UI features
 */

export type Language = 'fr' | 'en';

/** Card identity for UI/service boundaries. Use null when unknown; do not use 'unknown' sentinel. */
export type CardId = string | null;

export interface BilingualText {
  fr: string;
  en: string;
}

export interface BilingualLines {
  fr: string[];
  en: string[];
}

export interface ArcheCardData {
  card_id: string;
  name: BilingualText;
  body: BilingualLines;
}

export interface ArcheIds {
  cards: ArcheCardData[];
}
