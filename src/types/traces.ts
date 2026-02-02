/**
 * ARCHÉ — My Paris trace types (Fade-safe, local)
 * Quest completion traces shown in My Paris. No metrics.
 */

export type TraceKind = 'quest_walk' | 'quest_thread';

export interface QuestTraceStop {
  stopId: string;
  label: string;
}

export interface QuestTrace {
  kind: 'quest_walk';
  questId: string;
  title: string;
  closedAt: string; // ISO
  stops: QuestTraceStop[];
}

/** v1: stamps with timestamps + optional oracle line */
export interface QuestStopStamp {
  stopId: string;
  label: string;
  at: string; // ISO
  oracleLine?: string;
}

export interface QuestThreadTrace {
  kind: 'quest_thread';
  traceId: string;
  questId: string;
  title: string;
  createdAt: string; // ISO
  closedAt?: string; // ISO
  approxKm?: number;
  stamps: QuestStopStamp[];
}
