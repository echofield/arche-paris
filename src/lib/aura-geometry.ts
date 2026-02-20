import { line as d3Line, curveCatmullRom } from 'd3-shape';
import { createNoise2D } from 'simplex-noise';

export interface AuraWaveInput {
  width: number;
  height: number;
  phase: number;
  movement: number;
  shadow: number;
  echo: number;
  alignment: number;
}

export interface AuraWaveResult {
  path: string;
  ghostPath: string;
}

export type AuraNoiseFn = (x: number, t: number) => number;

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function hashStringToSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createAuraWaveNoise(seedKey: string): AuraNoiseFn {
  const seededRandom = mulberry32(hashStringToSeed(seedKey));
  const noise2d = createNoise2D(seededRandom);
  return (x: number, t: number) => noise2d(x, t);
}

export function createAuraWavePath(input: AuraWaveInput, noise: AuraNoiseFn): AuraWaveResult {
  const width = Math.max(1, input.width);
  const height = Math.max(24, input.height);
  const centerY = height * 0.5;
  const pointsCount = 32;
  const points: Array<[number, number]> = [];
  const ghostPoints: Array<[number, number]> = [];

  const movement = clamp01(input.movement);
  const shadow = clamp01(input.shadow);
  const echo = clamp01(input.echo);
  const alignment = clamp01(input.alignment);

  const amp = 4 + movement * 10 + echo * 4;
  const frequency = 1.2 + shadow * 1.6;
  const damping = 0.55 + alignment * 0.35;

  for (let i = 0; i < pointsCount; i += 1) {
    const t = i / (pointsCount - 1);
    const x = t * width;
    const edgeMask = Math.pow(Math.sin(Math.PI * t), 1.3);
    const sine = Math.sin((t * Math.PI * 2 * frequency) + input.phase);
    const organic = noise(t * 2.1, input.phase * 0.22) * 0.65;
    const y = centerY + (sine * damping + organic) * amp * edgeMask;
    const ghostY = centerY + (sine * 0.45 + organic * 0.3) * (amp * 0.55) * edgeMask;
    points.push([x, y]);
    ghostPoints.push([x, ghostY]);
  }

  const curve = curveCatmullRom.alpha(0.5);
  const renderer = d3Line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curve);

  return {
    path: renderer(points) ?? '',
    ghostPath: renderer(ghostPoints) ?? '',
  };
}

