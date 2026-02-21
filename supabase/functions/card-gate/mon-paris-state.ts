/**
 * Mon Paris entry + reading selectors. Pure, deterministic: same inputs => same output.
 * Entry: always one sentence (optional link). Reading: optional, daily gated, one sentence per layer.
 *
 * Symbols/traces: Backend has no symbol collection; "0/28 symboles" is client-side only (getCollection).
 * We use inscriptionsCount + hasAnyProgress (any meZones[].progress.entered) as proxy for empty/new user.
 */

export interface MonParisEntry {
  text: string;
  link?: { label: string; href: string };
  code?: string;
}

export interface MonParisReading {
  layer: "TRACE" | "RELATION" | "ECHO";
  text: string;
  code?: string;
}

type MeZone = {
  progress: { entered_at: string | null; entered?: boolean } | null;
  [k: string]: unknown;
};
type MeAura = { questCallout: { locked?: boolean } | null; [k: string]: unknown };
type ZoneInView = { arr: number; h3: string };

/** Paris date (YYYY-MM-DD) from an ISO timestamp. */
export function getParisDateFromIso(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

const TRACE_POOL = [
  "Chaque pas laisse une trace, même silencieuse.",
  "Votre carte garde la mémoire du passage.",
];
const RELATION_POOL = [
  "Votre marche commence à dessiner une géométrie.",
  "Certains axes reviennent — la ville vous connaît.",
];
const ECHO_POOL = [
  "Ici, une mémoire ancienne répond plus longtemps.",
  "Un seuil discret s'ouvre quand vous revenez.",
];

/** Entry selection: EMPTY → NEW_TERR (Paris date today) → UNLOCK → AURA (TODO) → FALLBACK. */
export function selectMonParisEntry(
  meZones: Record<string, MeZone>,
  meAura: MeAura,
  inscriptionsCount: number,
  zonesInView: ZoneInView[],
  parisDate: string
): MonParisEntry {
  const hasAnyProgress = Object.values(meZones).some(
    (z) => (z?.progress as { entered?: boolean } | null)?.entered === true
  );
  const empty = !hasAnyProgress && inscriptionsCount === 0;

  if (empty) {
    return {
      text: "Votre carte commence vide. La ville s'écrit en marchant.",
      code: "MP_ENTRY_EMPTY",
    };
  }

  // New territory: any zone entered today (same Paris date)
  let newest: { arr: number; h3: string } | null = null;
  for (const zone of zonesInView) {
    const data = meZones[zone.h3];
    const progress = data?.progress as { entered_at?: string | null } | null | undefined;
    const entered_at = progress?.entered_at;
    if (entered_at && getParisDateFromIso(entered_at) === parisDate) {
      if (!newest) newest = { arr: zone.arr, h3: zone.h3 };
    }
  }
  if (newest) {
    return {
      text: `Une ligne s'est ouverte dans le ${newest.h3}.`,
      link: { label: "Voir", href: "#collection" },
      code: "MP_ENTRY_NEW_TERR",
    };
  }

  if (meAura?.questCallout && !meAura.questCallout.locked) {
    return {
      text: "Un déplacement est ouvert.",
      link: { label: "Ouvrir", href: "#" },
      code: "MP_ENTRY_UNLOCK",
    };
  }

  // TODO: Aura shift — keep stub until backend exposes e.g. aura.dailySentenceMeta or aura.lastShiftAt
  // if (auraShiftToday) return { text: "Votre présence a bougé — une nuance a changé.", link: { label: "Voir Aura", href: "#aura" }, code: "MP_ENTRY_AURA" };

  return {
    text: "Marchez. La ville se révèle.",
    code: "MP_ENTRY_FALLBACK",
  };
}

/** Reading: TRACE (new user) | ECHO (unlock) | RELATION (>=3 arr). At most once/day per layer (hash gate). */
export function selectMonParisReading(
  meZones: Record<string, MeZone>,
  meAura: MeAura,
  inscriptionsCount: number,
  parisDate: string,
  cardId: string | null
): MonParisReading | null {
  const hasAnyProgress = Object.values(meZones).some(
    (z) => (z?.progress as { entered?: boolean } | null)?.entered === true
  );
  const visitedArrondissementsCount = Object.values(meZones).filter(
    (z) => (z?.progress as { entered?: boolean } | null)?.entered === true
  ).length;
  const hasUnlock = Boolean(meAura?.questCallout && !meAura.questCallout.locked);

  const seed = `${cardId ?? "anon"}:${parisDate}`;
  const gate = (layer: string) => simpleHash(`${seed}:${layer}`) % 2 === 0;

  // TRACE: user new (no progress). Once/day.
  if (!hasAnyProgress && inscriptionsCount === 0 && gate("TRACE")) {
    const idx = simpleHash(`${cardId ?? "anon"}:${parisDate}:TRACE`) % TRACE_POOL.length;
    return {
      layer: "TRACE",
      text: TRACE_POOL[idx],
      code: `MP_READING_TRACE_${idx}`,
    };
  }

  // ECHO: unlock present. Once/day.
  if (hasUnlock && gate("ECHO")) {
    const idx = simpleHash(`${cardId ?? "anon"}:${parisDate}:ECHO`) % ECHO_POOL.length;
    return {
      layer: "ECHO",
      text: ECHO_POOL[idx],
      code: `MP_READING_ECHO_${idx}`,
    };
  }

  // RELATION: >= 3 arrondissements. Throttle hash % 2.
  if (visitedArrondissementsCount >= 3 && gate("RELATION")) {
    const idx = simpleHash(`${cardId ?? "anon"}:${parisDate}:RELATION`) % RELATION_POOL.length;
    return {
      layer: "RELATION",
      text: RELATION_POOL[idx],
      code: `MP_READING_RELATION_${idx}`,
    };
  }

  return null;
}
