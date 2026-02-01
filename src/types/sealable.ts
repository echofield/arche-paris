/**
 * ARCHÉ — Sealable events (link layer)
 *
 * Events that COULD be optionally sealed later (kernel not connected).
 * A SealableEvent is created only by an explicit user gesture.
 * Sealing never upgrades identity; identity never upgrades experience.
 */

export type SealableEventKind = 'quest_completed' | 'place_claimed' | 'card_activated';

export interface SealableEvent {
  kind: SealableEventKind;
  questId?: string;
  lieuId?: string;
  cardId?: string;
  completedAt?: string;
  claimedAt?: string;
  /** Client-generated id for dedup in pending list */
  id?: string;
}

/**
 * Capability interface for optional sealing.
 * Stub implementation uses localStorage; later can be replaced by kernel client.
 */
export interface SealingCapability {
  listPending(): Promise<SealableEvent[]>;
  seal(event: SealableEvent): Promise<void>;
}
