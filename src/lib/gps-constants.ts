/**
 * ARCHÉ — GPS stabilization constants (single source of truth).
 *
 * Every GPS consumer (useStabilizedPosition, getStabilizedFix, tests)
 * should import from here rather than hardcoding thresholds.
 */

export const GPS_MAX_ACCURACY_M = 80;
export const GPS_WARMUP_STREAK = 3;
export const GPS_TELEPORT_M = 150;
export const GPS_TELEPORT_WINDOW_MS = 3000;
