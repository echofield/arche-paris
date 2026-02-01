/**
 * Approximate center (x%, y%) of each Paris arrondissement on the Parissvg.svg map.
 * Used for placing collected-symbol dots on My Paris map.
 * viewBox 0 0 2037.566 1615.5 → percentages for overlay.
 */
export const ARRONDISSEMENT_MAP_POSITION: Record<number, { x: number; y: number }> = {
  1: { x: 50, y: 55 },
  2: { x: 52, y: 52 },
  3: { x: 48, y: 52 },
  4: { x: 50, y: 58 },
  5: { x: 49, y: 60 },
  6: { x: 47, y: 58 },
  7: { x: 43, y: 56 },
  8: { x: 41, y: 52 },
  9: { x: 45, y: 49 },
  10: { x: 51, y: 49 },
  11: { x: 55, y: 52 },
  12: { x: 58, y: 56 },
  13: { x: 54, y: 62 },
  14: { x: 48, y: 63 },
  15: { x: 42, y: 61 },
  16: { x: 38, y: 54 },
  17: { x: 35, y: 50 },
  18: { x: 39, y: 45 },
  19: { x: 46, y: 44 },
  20: { x: 54, y: 47 }
};
