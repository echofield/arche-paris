/**
 * ARCHÉ — Piecewise affine warp for artistic map calibration.
 *
 * The Paris SVG is a stylized illustration, not a geographic projection.
 * A linear lat/lng → SVG mapping is mathematically clean but visually
 * wrong because the artist compressed/stretched arrondissements.
 *
 * This module sits between the linear projection and final rendering:
 *   lat/lng → projectLinear() → warpToArtistic() → svgXY
 *
 * It uses Delaunay triangulation over control anchors to compute a
 * piecewise affine transform that bends the linear projection to match
 * the artistic map. Points inside a triangle get an exact affine warp;
 * points outside fall back to linear projection.
 *
 * Math in 5 bullets:
 * 1. Each anchor has a "real" position (linear projection of its lat/lng)
 *    and an "artistic" position (where it sits on the SVG).
 * 2. Delaunay triangulation creates non-overlapping triangles from the
 *    real positions, covering the convex hull.
 * 3. For a query point, we find which triangle contains it using
 *    barycentric coordinates (u, v, w where u+v+w=1, all ≥ 0).
 * 4. The same barycentric weights applied to the artistic triangle
 *    vertices give the warped output — a smooth affine blend.
 * 5. Triangles share edges, so movement across borders is C0 continuous
 *    (no visual jumps).
 */

import Delaunator from 'delaunator';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from './map-project';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WarpAnchor {
  label: string;
  lat: number;
  lng: number;
  /** Target position on the artistic SVG (viewBox units) */
  svgX: number;
  svgY: number;
}

interface PreparedWarp {
  anchors: WarpAnchor[];
  /** Flat [x0,y0, x1,y1, ...] of linearly-projected anchor positions */
  realCoords: Float64Array;
  /** Triangle indices from Delaunator */
  triangles: Uint32Array;
  /** Number of triangles */
  triCount: number;
}

// ---------------------------------------------------------------------------
// Calibration anchors
// ---------------------------------------------------------------------------
// Each anchor maps a known geographic point to where it should appear
// on the artistic SVG. The svgX/svgY values come from
// ARRONDISSEMENT_MAP_POSITION (converted from % to viewBox units).
//
// Geographic centers are real arrondissement centroids from GeoJSON.
// ---------------------------------------------------------------------------

const PCT_TO_X = (pct: number) => (pct / 100) * VIEWBOX_WIDTH;
const PCT_TO_Y = (pct: number) => (pct / 100) * VIEWBOX_HEIGHT;

export const CALIBRATION_ANCHORS: WarpAnchor[] = [
  // Center (1–4)
  { label: '1e Louvre',         lat: 48.8610, lng: 2.3362, svgX: PCT_TO_X(48), svgY: PCT_TO_Y(48) },
  { label: '2e Bourse',         lat: 48.8687, lng: 2.3441, svgX: PCT_TO_X(51), svgY: PCT_TO_Y(42) },
  { label: '3e Temple',         lat: 48.8637, lng: 2.3612, svgX: PCT_TO_X(56), svgY: PCT_TO_Y(44) },
  { label: '4e Hôtel-de-Ville', lat: 48.8544, lng: 2.3574, svgX: PCT_TO_X(54), svgY: PCT_TO_Y(50) },

  // Left Bank inner (5–7)
  { label: '5e Panthéon',       lat: 48.8462, lng: 2.3508, svgX: PCT_TO_X(52), svgY: PCT_TO_Y(58) },
  { label: '6e Luxembourg',     lat: 48.8498, lng: 2.3322, svgX: PCT_TO_X(45), svgY: PCT_TO_Y(56) },
  { label: '7e Palais-Bourbon', lat: 48.8575, lng: 2.3127, svgX: PCT_TO_X(38), svgY: PCT_TO_Y(52) },

  // Right Bank outer NW (8–10)
  { label: '8e Élysée',         lat: 48.8744, lng: 2.3106, svgX: PCT_TO_X(40), svgY: PCT_TO_Y(40) },
  { label: '9e Opéra',          lat: 48.8768, lng: 2.3382, svgX: PCT_TO_X(48), svgY: PCT_TO_Y(36) },
  { label: '10e Entrepôt',      lat: 48.8762, lng: 2.3614, svgX: PCT_TO_X(56), svgY: PCT_TO_Y(36) },

  // Right Bank outer E (11–12)
  { label: '11e Popincourt',    lat: 48.8596, lng: 2.3810, svgX: PCT_TO_X(62), svgY: PCT_TO_Y(46) },
  { label: '12e Reuilly',       lat: 48.8396, lng: 2.4160, svgX: PCT_TO_X(68), svgY: PCT_TO_Y(56) },

  // Left Bank outer (13–15)
  { label: '13e Gobelins',      lat: 48.8322, lng: 2.3561, svgX: PCT_TO_X(58), svgY: PCT_TO_Y(68) },
  { label: '14e Observatoire',  lat: 48.8331, lng: 2.3264, svgX: PCT_TO_X(45), svgY: PCT_TO_Y(70) },
  { label: '15e Vaugirard',     lat: 48.8421, lng: 2.2990, svgX: PCT_TO_X(32), svgY: PCT_TO_Y(62) },

  // Right Bank outer W (16–17)
  { label: '16e Passy',         lat: 48.8590, lng: 2.2686, svgX: PCT_TO_X(25), svgY: PCT_TO_Y(45) },
  { label: '17e Batignolles',   lat: 48.8880, lng: 2.3140, svgX: PCT_TO_X(35), svgY: PCT_TO_Y(30) },

  // Right Bank outer NE (18–20)
  { label: '18e Montmartre',    lat: 48.8925, lng: 2.3444, svgX: PCT_TO_X(48), svgY: PCT_TO_Y(24) },
  { label: '19e Buttes-Chaumont', lat: 48.8860, lng: 2.3822, svgX: PCT_TO_X(62), svgY: PCT_TO_Y(28) },
  { label: '20e Ménilmontant',  lat: 48.8638, lng: 2.3985, svgX: PCT_TO_X(70), svgY: PCT_TO_Y(42) },
];

// ---------------------------------------------------------------------------
// Linear projection (same math as map-project.ts, duplicated to avoid
// circular dependency — this module is imported BY map-project)
// ---------------------------------------------------------------------------

const LNG_WEST = 2.2092;
const LNG_EAST = 2.4796;
const LAT_SOUTH = 48.7892;
const LAT_NORTH = 48.9251;

function linearProject(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng - LNG_WEST) / (LNG_EAST - LNG_WEST)) * VIEWBOX_WIDTH,
    y: ((LAT_NORTH - lat) / (LAT_NORTH - LAT_SOUTH)) * VIEWBOX_HEIGHT,
  };
}

// ---------------------------------------------------------------------------
// Prepare triangulation (runs once at module load)
// ---------------------------------------------------------------------------

function prepare(anchors: WarpAnchor[]): PreparedWarp {
  const realCoords = new Float64Array(anchors.length * 2);
  for (let i = 0; i < anchors.length; i++) {
    const p = linearProject(anchors[i].lat, anchors[i].lng);
    realCoords[i * 2] = p.x;
    realCoords[i * 2 + 1] = p.y;
  }
  const d = new Delaunator(realCoords);
  return {
    anchors,
    realCoords,
    triangles: d.triangles,
    triCount: d.triangles.length / 3,
  };
}

const WARP = prepare(CALIBRATION_ANCHORS);

// ---------------------------------------------------------------------------
// Barycentric lookup
// ---------------------------------------------------------------------------

function barycentricInTriangle(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): { u: number; v: number; w: number } | null {
  const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  if (Math.abs(det) < 1e-10) return null;
  const u = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / det;
  const v = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / det;
  const w = 1 - u - v;
  const EPS = -1e-6;
  if (u < EPS || v < EPS || w < EPS) return null;
  return { u, v, w };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface WarpResult {
  x: number;
  y: number;
  triangleIndex: number; // -1 if fallback to linear
}

/**
 * Warp a linearly-projected SVG point to the artistic map position.
 * Pass the output of projectLinear() as input.
 */
export function warpToArtistic(linearX: number, linearY: number): WarpResult {
  const { anchors, realCoords, triangles, triCount } = WARP;

  for (let t = 0; t < triCount; t++) {
    const i0 = triangles[t * 3];
    const i1 = triangles[t * 3 + 1];
    const i2 = triangles[t * 3 + 2];

    const bary = barycentricInTriangle(
      linearX, linearY,
      realCoords[i0 * 2], realCoords[i0 * 2 + 1],
      realCoords[i1 * 2], realCoords[i1 * 2 + 1],
      realCoords[i2 * 2], realCoords[i2 * 2 + 1],
    );

    if (bary) {
      return {
        x: bary.u * anchors[i0].svgX + bary.v * anchors[i1].svgX + bary.w * anchors[i2].svgX,
        y: bary.u * anchors[i0].svgY + bary.v * anchors[i1].svgY + bary.w * anchors[i2].svgY,
        triangleIndex: t,
      };
    }
  }

  // Outside convex hull — fall back to linear projection
  return { x: linearX, y: linearY, triangleIndex: -1 };
}

/**
 * Full pipeline: lat/lng → linear projection → affine warp → SVG XY.
 */
export function projectWarped(lat: number, lng: number): WarpResult {
  const lin = linearProject(lat, lng);
  return warpToArtistic(lin.x, lin.y);
}
