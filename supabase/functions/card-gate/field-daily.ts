/**
 * ARCHÉ — Deterministic daily sentence selector from field pack.
 * One sentence per (day, userId, zoneId). Date key uses Europe/Paris day boundary.
 */

import type { FieldPack } from "./field-packs.ts";

/** Paris local date YYYY-MM-DD for stable daily key. */
export function todayParis(): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/\//g, "-");
}

/** FNV-1a 32-bit hash (stable, no deps). */
function fnv1a32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type DailySentenceResult = {
  sentence: string;
  meta?: { source: "fieldPack"; zoneId: string; date: string };
};

/**
 * Select exactly one sentence from field pack for (date, userId, zoneId).
 * Pool: nodes[].fieldSentence then whispers[]. Deterministic via FNV-1a of key.
 */
export function selectDailySentence(
  fieldPack: FieldPack,
  userId: string,
  zoneId: string,
  dateParis: string
): DailySentenceResult {
  const pool: string[] = [];
  for (const node of fieldPack.nodes) {
    if (node.fieldSentence?.trim()) pool.push(node.fieldSentence.trim());
  }
  for (const w of fieldPack.whispers) {
    if (w?.trim()) pool.push(w.trim());
  }
  if (pool.length === 0) {
    return { sentence: "", meta: { source: "fieldPack", zoneId, date: dateParis } };
  }
  const key = `${dateParis}|${userId}|${zoneId}`;
  const hash = fnv1a32(key);
  const index = hash % pool.length;
  const raw = pool[index] ?? pool[0];
  const sentence = toSignalSentence(raw);
  return {
    sentence,
    meta: { source: "fieldPack", zoneId, date: dateParis },
  };
}

/** Max 140 chars, no newlines — signal-sized, calm witness tone. */
const MAX_DAILY_SENTENCE_LENGTH = 140;

function toSignalSentence(s: string): string {
  const oneLine = s.replace(/\s+/g, " ").trim();
  if (oneLine.length <= MAX_DAILY_SENTENCE_LENGTH) return oneLine;
  return oneLine.slice(0, MAX_DAILY_SENTENCE_LENGTH).trim();
}
