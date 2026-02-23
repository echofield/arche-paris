/**
 * ARCHÉ Motion Language tokens.
 * Single source of truth for durations, easings, presets and allowed animated properties.
 */

export type MotionSpeed = "instant" | "brisk" | "measured" | "contemplative" | "ambient";
export type MotionWeight = "feather" | "paper" | "glass" | "stone";
export type MotionEaseKind = "appear" | "transition" | "dismiss" | "continuous";
export type MotionStaggerPattern = "layeredEntrance" | "staggeredPulse";
export type MotionAnimProperty = "opacity" | "transform" | "filter";

export interface MotionTransformPreset {
  from: { opacity: number; transform: string; filter?: string };
  to: { opacity: number; transform: string; filter?: string };
}

export interface MotionTransitionPart {
  property: MotionAnimProperty;
  durationMs: number;
  easing: string;
  delayMs?: number;
}

export interface MotionTokenModule {
  durations: Record<MotionSpeed, number>;
  weights: Record<MotionWeight, number>;
  easings: Record<MotionEaseKind, string>;
  transforms: {
    appear: MotionTransformPreset;
    dismiss: MotionTransformPreset;
    activate: MotionTransformPreset;
  };
  staggerPatterns: Record<MotionStaggerPattern, number[]>;
  t: (speedOrWeight: MotionSpeed | MotionWeight) => number;
  ease: (kind: MotionEaseKind) => string;
  transition: (parts: MotionTransitionPart[]) => string;
  appear: { durationMs: number; easing: string; transition: string; transitionInstant: string };
  dismiss: { durationMs: number; easing: string; transition: string };
  activate: { durationMs: number; easing: string; transition: string };
  stagger: (layers: number, pattern?: MotionStaggerPattern) => number[];
  interpolate: (kind: MotionEaseKind, progress: number) => number;
  prefersReducedMotion: () => boolean;
  reducedMs: () => number;
  acquireStone: (scope: string) => (() => void) | null;
  /** Meridian instrument: named ms for intro phases (no raw numbers in components). */
  ms: { introIdle: number; introCal: number };
}

const stoneAuthority: { scope: string | null } = { scope: null };

const durations: Record<MotionSpeed, number> = {
  instant: 90,
  brisk: 200,
  measured: 400,
  contemplative: 1000,
  ambient: 60000,
};

const weights: Record<MotionWeight, number> = {
  feather: 200,
  paper: 350,
  glass: 600,
  stone: 1200,
};

const easings: Record<MotionEaseKind, string> = {
  appear: "cubic-bezier(0, 0, 0.2, 1)",
  transition: "cubic-bezier(0.4, 0, 0.2, 1)",
  dismiss: "cubic-bezier(0.4, 0, 1, 1)",
  continuous: "linear",
};

const transforms: MotionTokenModule["transforms"] = {
  appear: {
    from: { opacity: 0, transform: "translateY(-10px)" },
    to: { opacity: 1, transform: "translateY(0px)" },
  },
  dismiss: {
    from: { opacity: 1, transform: "translateY(0px)" },
    to: { opacity: 0, transform: "translateY(10px)" },
  },
  activate: {
    from: { opacity: 0.3, transform: "scale(1)", filter: "blur(0.5px)" },
    to: { opacity: 0.8, transform: "scale(1.12)", filter: "blur(0px)" },
  },
};

/** Standalone impl to avoid TDZ when method and function share a name after minification. */
const getPrefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

function toTransition(parts: MotionTransitionPart[]): string {
  return parts
    .map((part) => {
      const delay = part.delayMs && part.delayMs > 0 ? ` ${part.delayMs}ms` : "";
      return `${part.property} ${part.durationMs}ms ${part.easing}${delay}`;
    })
    .join(", ");
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function cubicBezierAt(x1: number, y1: number, x2: number, y2: number, t: number): number {
  const p = clamp01(t);
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleDX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;

  let u = p;
  for (let i = 0; i < 6; i += 1) {
    const x = sampleX(u) - p;
    const dx = sampleDX(u);
    if (Math.abs(x) < 1e-5 || Math.abs(dx) < 1e-5) break;
    u -= x / dx;
  }
  return clamp01(sampleY(clamp01(u)));
}

const appearDuration = durations.measured;
const dismissDuration = Math.round(appearDuration * 1.5);
const activateDuration = durations.brisk;

/** Meridian instrument: snapshot throttle and deadband (no raw numbers in MeridiensLive). */
export const MERIDIAN_FETCH_DEADBAND_M = 15;
export const MERIDIAN_FETCH_DEADBAND_DEG = 15;
export const MERIDIAN_FETCH_MIN_INTERVAL_MS = 5000;

const meridianIntroIdleMs = durations.measured;
const meridianIntroCalMs = durations.contemplative;

export const motion: MotionTokenModule = {
  durations,
  weights,
  easings,
  transforms,
  staggerPatterns: {
    layeredEntrance: [0, 100, 200, 300, 500],
    staggeredPulse: [0, 150, 300, 450, 600],
  },
  t(speedOrWeight) {
    if (speedOrWeight in durations) return durations[speedOrWeight as MotionSpeed];
    return weights[speedOrWeight as MotionWeight];
  },
  ease(kind) {
    return easings[kind];
  },
  transition(parts) {
    return toTransition(parts);
  },
  appear: {
    durationMs: appearDuration,
    easing: easings.appear,
    transition: toTransition([
      { property: "opacity", durationMs: appearDuration, easing: easings.appear },
      { property: "transform", durationMs: appearDuration, easing: easings.appear },
      { property: "filter", durationMs: appearDuration, easing: easings.appear },
    ]),
    transitionInstant: toTransition([
      { property: "opacity", durationMs: durations.instant, easing: easings.appear },
      { property: "transform", durationMs: durations.instant, easing: easings.appear },
      { property: "filter", durationMs: durations.instant, easing: easings.appear },
    ]),
  },
  dismiss: {
    durationMs: dismissDuration,
    easing: easings.dismiss,
    transition: toTransition([
      { property: "opacity", durationMs: dismissDuration, easing: easings.dismiss },
      { property: "transform", durationMs: dismissDuration, easing: easings.dismiss },
      { property: "filter", durationMs: dismissDuration, easing: easings.dismiss },
    ]),
  },
  activate: {
    durationMs: activateDuration,
    easing: easings.transition,
    transition: toTransition([
      { property: "opacity", durationMs: activateDuration, easing: easings.transition },
      { property: "transform", durationMs: activateDuration, easing: easings.transition },
      { property: "filter", durationMs: activateDuration, easing: easings.transition },
    ]),
  },
  stagger(layers, pattern = "layeredEntrance") {
    const source = this.staggerPatterns[pattern];
    return Array.from({ length: Math.max(0, layers) }, (_, i) => {
      if (i < source.length) return source[i];
      return source[source.length - 1] + (i - source.length + 1) * 100;
    });
  },
  interpolate(kind, progress) {
    if (kind === "continuous") return clamp01(progress);
    if (kind === "appear") return cubicBezierAt(0, 0, 0.2, 1, progress);
    if (kind === "transition") return cubicBezierAt(0.4, 0, 0.2, 1, progress);
    return cubicBezierAt(0.4, 0, 1, 1, progress);
  },
  prefersReducedMotion() {
    return getPrefersReducedMotion();
  },
  reducedMs() {
    return getPrefersReducedMotion() ? 10 : 0;
  },
  acquireStone(scope) {
    if (stoneAuthority.scope && stoneAuthority.scope !== scope) return null;
    stoneAuthority.scope = scope;
    return () => {
      if (stoneAuthority.scope === scope) stoneAuthority.scope = null;
    };
  },
  ms: {
    introIdle: meridianIntroIdleMs,
    introCal: meridianIntroCalMs,
  },
};
