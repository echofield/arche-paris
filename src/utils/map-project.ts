/**
 * ARCHÉ — Paris lat/lng → SVG x,y for viewBox 2037.566 × 1615.5
 * Used to draw quest threads and stamps on the Paris stroke map.
 */

const VIEWBOX_WIDTH = 2037.566;
const VIEWBOX_HEIGHT = 1615.5;

// Paris city bounds (approximate)
const LNG_WEST = 2.22;
const LNG_EAST = 2.47;
const LAT_SOUTH = 48.80;
const LAT_NORTH = 48.92;

export interface XY {
  x: number;
  y: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Project a single lat/lng point to SVG coordinates in viewBox space.
 */
export function project(lat: number, lng: number): XY {
  const x = ((lng - LNG_WEST) / (LNG_EAST - LNG_WEST)) * VIEWBOX_WIDTH;
  const y = ((LAT_NORTH - lat) / (LAT_NORTH - LAT_SOUTH)) * VIEWBOX_HEIGHT;
  return { x, y };
}

/**
 * Project an array of lat/lng points to SVG coordinates.
 */
export function projectPath(coords: LatLng[]): XY[] {
  return coords.map((c) => project(c.lat, c.lng));
}

/** Scale from default viewBox (2037×1615) to another width×height (e.g. 800×600). */
export function scaleToViewBox(pt: XY, width: number, height: number): XY {
  return {
    x: (pt.x / VIEWBOX_WIDTH) * width,
    y: (pt.y / VIEWBOX_HEIGHT) * height
  };
}
