/**
 * ARCHÉ — Echo Pack v0: doors/vestiges per arrondissement (La Ville).
 * Seed data: docs/arche_echo_pack_v0.json. UI renders from this; no local derivation.
 */

export type EchoAnchorType =
  | 'passage'
  | 'seuil'
  | 'axe'
  | 'cour'
  | 'atelier'
  | 'façade'
  | 'vide'
  | 'densité';

export interface EchoZonePack {
  doors: string[];
  vestiges: string[];
  anchorType: EchoAnchorType;
}

export interface ArcheEchoPackV0 {
  version: string;
  zones: Record<string, EchoZonePack>;
}

const PACK_URL = '/arche_echo_pack_v0.json';

let cached: ArcheEchoPackV0 | null = null;

export async function loadEchoPackV0(): Promise<ArcheEchoPackV0> {
  if (cached) return cached;
  const res = await fetch(PACK_URL);
  if (!res.ok) throw new Error(`Echo pack load failed: ${res.status}`);
  const data = (await res.json()) as ArcheEchoPackV0;
  cached = data;
  return data;
}

export function getEchoZonePack(pack: ArcheEchoPackV0 | null, zoneId: string): EchoZonePack | null {
  if (!pack) return null;
  const key = zoneId.startsWith('PAR-') ? zoneId : `PAR-${String(zoneId).padStart(2, '0')}`;
  return pack.zones[key] ?? null;
}

export function zoneIdToH3(arr: number): string {
  return `PAR-${String(arr).padStart(2, '0')}`;
}
