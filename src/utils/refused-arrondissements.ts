/**
 * ARCHÉ — The Unmarked: arrondissements the user has consciously refused.
 * "You have not walked here. Is this choice?" → mark as refused. No names, no tracking.
 */

const STORAGE_KEY = 'arche_refused_arrondissements_v1';

function load(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n: unknown) => typeof n === 'number' && n >= 1 && n <= 20) : [];
  } catch {
    return [];
  }
}

function save(arr: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(arr)].sort((a, b) => a - b)));
  } catch (e) {
    console.warn('refused-arrondissements: save failed', e);
  }
}

export function getRefusedArrondissements(): number[] {
  return load();
}

export function isRefused(arrondissement: number): boolean {
  return load().includes(arrondissement);
}

export function setRefused(arrondissement: number, refused: boolean): void {
  const list = load();
  if (refused && !list.includes(arrondissement)) {
    save([...list, arrondissement]);
  } else if (!refused && list.includes(arrondissement)) {
    save(list.filter((n) => n !== arrondissement));
  }
}

export function toggleRefused(arrondissement: number): void {
  setRefused(arrondissement, !isRefused(arrondissement));
}
