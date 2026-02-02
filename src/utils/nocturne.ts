/**
 * ARCHÉ — Nocturne: 22:00–05:00 local. No toggle; the city knows.
 */

export function isNocturne(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 5;
}
