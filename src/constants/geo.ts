/**
 * ARCHÉ — Shared geo constants.
 * Single source of truth for accuracy thresholds used by map/presence features.
 */

/** Max GPS accuracy (m) to accept a position for presence pulse / marker updates. 30m keeps urban noise manageable while still reacting to movement. */
export const MARKER_MAX_ACCURACY_M = 30;
