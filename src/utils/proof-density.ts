/**
 * ARCHÉ — Proof Density: "Others have stood here." / "Few have found this."
 * Stub: no backend yet, returns 'none'. When backend exists, returns none | few | some | many.
 */

export type DensityCategory = 'none' | 'few' | 'some' | 'many';

const STUB_NO_BACKEND = true;

export async function getProofDensity(artifactId: string): Promise<DensityCategory> {
  if (STUB_NO_BACKEND) return 'none';
  try {
    // When backend exists: GET /api/density?artifact=artifactId → { density: 'few' | 'many' }
    const res = await fetch(`/api/density?artifact=${encodeURIComponent(artifactId)}`);
    if (!res.ok) return 'none';
    const data = await res.json();
    const d = data?.density;
    if (d === 'few' || d === 'some' || d === 'many') return d;
    return 'none';
  } catch {
    return 'none';
  }
}
