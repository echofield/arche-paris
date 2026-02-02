/**
 * ARCHÉ — Run delayed resonance (echo) and silent milestones on app load.
 * Idempotent. No UI; just inserts Carnet lines when conditions are met.
 */

import { getArtifactById } from '../data/artifacts';
import { getProofsReadyToEcho, markProofEchoed } from './proof-echo';
import { appendEchoToJournal } from './journal-sync';
import { getTotalKm, getNextMilestoneToInscribe, markMilestoneSeen } from './walk-service';
import { appendMilestoneToJournal } from './journal-sync';
import { getStoredCard } from './card-service';

/** Run echo: for each proof ready (24h+ old, not yet echoed), insert Carnet line and mark echoed. */
export async function runEchoIfNeeded(): Promise<void> {
  const cardId = getStoredCard();
  if (!cardId) return;
  const ready = getProofsReadyToEcho();
  for (const req of ready) {
    const artifact = getArtifactById(req.artifactId);
    const title = artifact?.title ?? req.artifactId;
    await appendEchoToJournal(cardId, req.artifactId, title, req.at);
    markProofEchoed(req.artifactId, req.at);
  }
}

/** Run milestones: if total km >= next threshold and not yet inscribed, insert Carnet line and mark. */
export async function runMilestonesIfNeeded(): Promise<void> {
  const cardId = getStoredCard();
  if (!cardId) return;
  const totalKm = getTotalKm();
  let next = getNextMilestoneToInscribe(totalKm);
  while (next != null) {
    const contentLine = getMilestoneContent(next);
    await appendMilestoneToJournal(cardId, next, contentLine);
    markMilestoneSeen(next);
    next = getNextMilestoneToInscribe(getTotalKm());
  }
}

function getMilestoneContent(km: number): string {
  // FR for v1; i18n can be added later
  const lines: Record<number, string> = {
    10: "10 kilomètres. La ville t'a porté jusque-là.",
    50: "50 kilomètres. La ville t'a porté jusque-là.",
    100: "100 kilomètres. La ville t'a porté jusque-là.",
    500: "500 kilomètres. La ville t'a porté jusque-là."
  };
  return lines[km] ?? `${km} kilomètres. La ville t'a porté jusque-là.`;
}
