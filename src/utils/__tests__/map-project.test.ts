import { describe, it, expect } from 'vitest';
import { project, projectPct, VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../map-project';
import { ARRONDISSEMENT_MAP_POSITION } from '../../data/arrondissement-positions';

/**
 * Acceptance tests for GPS → SVG projection accuracy.
 *
 * Goal: at Map Level 0 (stylized plate) we need neighborhood accuracy,
 * not meter precision. A projected point must land within a small
 * percentage tolerance of the expected arrondissement anchor position.
 */

const TOLERANCE_PCT = 4; // ±4 percentage points ≈ ±500 m

const REFERENCE_POINTS: Array<{
  name: string;
  lat: number;
  lng: number;
  expectedArr: number;
}> = [
  { name: 'Bercy (12e)', lat: 48.847, lng: 2.395, expectedArr: 12 },
  { name: 'Louvre (1er)', lat: 48.860, lng: 2.342, expectedArr: 1 },
  { name: 'Montmartre (18e)', lat: 48.892, lng: 2.344, expectedArr: 18 },
  { name: 'Trocadéro (16e)', lat: 48.863, lng: 2.276, expectedArr: 16 },
  { name: 'Ménilmontant (20e)', lat: 48.864, lng: 2.398, expectedArr: 20 },
  { name: 'Vaugirard (15e)', lat: 48.842, lng: 2.299, expectedArr: 15 },
];

describe('map-project: GPS → SVG projection', () => {
  it('projects to valid viewBox coordinates', () => {
    const p = project(48.847, 2.395);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(VIEWBOX_WIDTH);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(VIEWBOX_HEIGHT);
  });

  for (const ref of REFERENCE_POINTS) {
    it(`${ref.name} lands near ${ref.expectedArr}e anchor within ±${TOLERANCE_PCT}%`, () => {
      const { xPct, yPct } = projectPct(ref.lat, ref.lng);
      const anchor = ARRONDISSEMENT_MAP_POSITION[ref.expectedArr];
      expect(anchor).toBeDefined();

      const dx = Math.abs(xPct - anchor.x);
      const dy = Math.abs(yPct - anchor.y);

      expect(dx).toBeLessThan(TOLERANCE_PCT);
      expect(dy).toBeLessThan(TOLERANCE_PCT);
    });
  }

  it('no reference point projects >1 km from its arrondissement center', () => {
    for (const ref of REFERENCE_POINTS) {
      const { xPct, yPct } = projectPct(ref.lat, ref.lng);
      const anchor = ARRONDISSEMENT_MAP_POSITION[ref.expectedArr];
      const dist = Math.sqrt(
        Math.pow(xPct - anchor.x, 2) + Math.pow(yPct - anchor.y, 2)
      );
      // 1 km ≈ 7.5 pct units on this map scale
      expect(dist).toBeLessThan(7.5);
    }
  });
});
