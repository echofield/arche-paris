/**
 * ARCHÉ — Quest run (thread on map, world-only, localStorage)
 */

export interface QuestRun {
  runId: string;
  questId: string;
  startedAt: string; // ISO
  visited: Record<string, { at: string; evidenceLocalIds?: string[] }>; // keyed by nodeId
  closedAt?: string;
  reward?: { kind: 'card'; id: string };
}
