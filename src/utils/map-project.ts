/**
 * ARCHÉ — Paris lat/lng → SVG x,y for viewBox 2037.566 × 1615.5
 *
 * Pipeline:
 *   lat/lng → projectLinear() → warpToArtistic() → svgXY
 *
 * projectLinear() is a pure equirectangular projection.
 * project() adds a piecewise affine warp that bends the output
 * to match the artistic SVG illustration.
 */

import { projectWarped, type WarpResult } from './map-warp';

export const VIEWBOX_WIDTH = 2037.566;
export const VIEWBOX_HEIGHT = 1615.5;

// Paris city bounds — calibrated against ARRONDISSEMENT_MAP_POSITION
// and real geographic arrondissement centers (least-squares fit).
const LNG_WEST = 2.2092;
const LNG_EAST = 2.4796;
const LAT_SOUTH = 48.7892;
const LAT_NORTH = 48.9251;

export interface XY {
  x: number;
  y: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Pure linear projection (no artistic warp).
 * Use for debug comparisons or when you need raw geographic mapping.
 */
export function projectLinear(lat: number, lng: number): XY {
  const x = ((lng - LNG_WEST) / (LNG_EAST - LNG_WEST)) * VIEWBOX_WIDTH;
  const y = ((LAT_NORTH - lat) / (LAT_NORTH - LAT_SOUTH)) * VIEWBOX_HEIGHT;
  return { x, y };
}

/**
 * Project a single lat/lng point to SVG coordinates in viewBox space.
 * Applies piecewise affine warp to match the artistic map.
 */
export function project(lat: number, lng: number): XY {
  const w = projectWarped(lat, lng);
  return { x: w.x, y: w.y };
}

/**
 * Project with full warp metadata (triangle index for debug).
 */
export function projectWithMeta(lat: number, lng: number): WarpResult {
  return projectWarped(lat, lng);
}

/** Inverse: SVG percentage (0-100) back to lat/lng (linear only). */
export function unproject(xPct: number, yPct: number): LatLng {
  return {
    lng: LNG_WEST + (xPct / 100) * (LNG_EAST - LNG_WEST),
    lat: LAT_NORTH - (yPct / 100) * (LAT_NORTH - LAT_SOUTH),
  };
}

/** Convert projected SVG coords to 0-100 percentage (warped). */
export function projectPct(lat: number, lng: number): { xPct: number; yPct: number } {
  const p = project(lat, lng);
  return { xPct: (p.x / VIEWBOX_WIDTH) * 100, yPct: (p.y / VIEWBOX_HEIGHT) * 100 };
}

/**
 * Project an array of lat/lng points to SVG coordinates (warped).
 */
export function projectPath(coords: LatLng[]): XY[] {
  return coords.map((c) => project(c.lat, c.lng));
}

/** Scale from default viewBox (2037×1615) to another width×height. */
export function scaleToViewBox(pt: XY, width: number, height: number): XY {
  return {
    x: (pt.x / VIEWBOX_WIDTH) * width,
    y: (pt.y / VIEWBOX_HEIGHT) * height,
  };
}
