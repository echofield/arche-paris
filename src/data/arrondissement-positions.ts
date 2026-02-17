/**
 * Approximate center (x%, y%) of each Paris arrondissement on the Parissvg.svg map.
 * Used for placing collected-symbol dots on My Paris map.
 * viewBox 0 0 2037.566 1615.5 → percentages for overlay.
 *
 * Paris arrondissements spiral clockwise from center:
 * 1-4 center, then spiraling outward
 */
export const ARRONDISSEMENT_MAP_POSITION: Record<number, { x: number; y: number }> = {
  // Center (1-4)
  1: { x: 48, y: 48 },   // Louvre - center
  2: { x: 51, y: 42 },   // Bourse - north of center
  3: { x: 56, y: 44 },   // Temple - northeast of center
  4: { x: 54, y: 50 },   // Hôtel-de-Ville - east of center

  // Left Bank inner (5-7)
  5: { x: 52, y: 58 },   // Panthéon - south center
  6: { x: 45, y: 56 },   // Luxembourg - southwest of center
  7: { x: 38, y: 52 },   // Palais-Bourbon - west (Eiffel Tower area)

  // Right Bank outer northwest (8-10)
  8: { x: 40, y: 40 },   // Élysée - northwest (Champs-Élysées)
  9: { x: 48, y: 36 },   // Opéra - north
  10: { x: 56, y: 36 },  // Entrepôt - northeast (Gare du Nord)

  // Right Bank outer east (11-12)
  11: { x: 62, y: 46 },  // Popincourt - east
  12: { x: 68, y: 56 },  // Reuilly - southeast (Bercy)

  // Left Bank outer (13-15)
  13: { x: 58, y: 68 },  // Gobelins - south
  14: { x: 45, y: 70 },  // Observatoire - south
  15: { x: 32, y: 62 },  // Vaugirard - southwest

  // Right Bank outer west (16-17)
  16: { x: 25, y: 45 },  // Passy - west (Trocadéro)
  17: { x: 35, y: 30 },  // Batignolles - northwest

  // Right Bank outer north-east (18-20)
  18: { x: 48, y: 24 },  // Buttes-Montmartre - north (Montmartre)
  19: { x: 62, y: 28 },  // Buttes-Chaumont - northeast
  20: { x: 70, y: 42 }   // Ménilmontant - east (Père Lachaise)
};
