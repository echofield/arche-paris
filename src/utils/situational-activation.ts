export type CanonicalExistentialAct =
  | 'Witness'
  | 'Consecrate'
  | 'Guard'
  | 'Testify'
  | 'Integrate';

export type UrbanArtifactType =
  | 'threshold_marker'
  | 'public_clock'
  | 'liturgical_artifact'
  | 'civic_emblem'
  | 'inscription_stone'
  | 'water_structure'
  | 'trade_residue'
  | 'rupture_trace'
  | 'justice_architecture'
  | 'knowledge_artifact'
  | 'funerary_artifact'
  | 'technical_hidden';

export interface ComplexionVector {
  presence: number;
  wisdom: number;
  shadow: number;
}

export interface SituationalContext {
  dwellMinutes: number;
  revisitsAtArtifact: number;
  displacementMeters?: number;
  weather?: 'clear' | 'rain' | 'wind' | 'cold' | 'heat';
  timeBand?: 'dawn' | 'day' | 'dusk' | 'night';
  nearbyRitualDensity?: number; // 0..1
}

export interface ZoneConsciousnessGate {
  entropy: number; // 0..1
  resonance: number; // 0..1
  unresolvedThreads: number;
  guardianDecay: number; // 0..1
}

export interface ActivationInput {
  artifactType: UrbanArtifactType;
  semanticsTags: string[];
  complexion: ComplexionVector;
  context: SituationalContext;
  zoneConsciousness?: ZoneConsciousnessGate;
}

export interface ActActivation {
  act: CanonicalExistentialAct;
  intensity: number; // 0..1
  transformationAxis: 'presence' | 'wisdom' | 'shadow';
}

export interface ActivationResult {
  isOpen: boolean;
  refusalLine?: string;
  friction: {
    time: boolean;
    space: boolean;
    existential: boolean;
    passed: boolean;
  };
  validActs: ActActivation[];
  opacityReduction: number; // 0..1
  transformationPotential: number; // 0..1
}

const CANONICAL_BY_ARTIFACT: Record<UrbanArtifactType, CanonicalExistentialAct[]> = {
  threshold_marker: ['Witness', 'Consecrate', 'Testify', 'Integrate'],
  public_clock: ['Witness', 'Testify', 'Integrate'],
  liturgical_artifact: ['Witness', 'Consecrate', 'Integrate'],
  civic_emblem: ['Witness', 'Guard', 'Testify', 'Integrate'],
  inscription_stone: ['Witness', 'Testify', 'Integrate'],
  water_structure: ['Witness', 'Consecrate', 'Integrate'],
  trade_residue: ['Witness', 'Testify', 'Integrate'],
  rupture_trace: ['Witness', 'Guard', 'Testify', 'Integrate'],
  justice_architecture: ['Witness', 'Guard', 'Testify', 'Integrate'],
  knowledge_artifact: ['Witness', 'Testify', 'Integrate'],
  funerary_artifact: ['Witness', 'Guard', 'Integrate'],
  technical_hidden: ['Witness', 'Integrate'],
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function axisForAct(act: CanonicalExistentialAct): 'presence' | 'wisdom' | 'shadow' {
  if (act === 'Witness' || act === 'Consecrate') return 'presence';
  if (act === 'Guard' || act === 'Integrate') return 'wisdom';
  return 'shadow';
}

function complexionWeight(axis: 'presence' | 'wisdom' | 'shadow', c: ComplexionVector): number {
  if (axis === 'presence') return clamp01(c.presence / 100);
  if (axis === 'wisdom') return clamp01(c.wisdom / 100);
  return clamp01(c.shadow / 100);
}

function contextWeight(ctx: SituationalContext): number {
  const dwell = clamp01(ctx.dwellMinutes / 12);
  const revisits = clamp01(ctx.revisitsAtArtifact / 4);
  const density = clamp01(ctx.nearbyRitualDensity ?? 0.4);
  return clamp01(0.45 * dwell + 0.35 * revisits + 0.2 * density);
}

function semanticWeight(tags: string[]): number {
  const meaningful = tags.filter((t) => t.trim().length > 0).length;
  return clamp01(meaningful / 6);
}

function dominantAxis(c: ComplexionVector): 'presence' | 'wisdom' | 'shadow' {
  if (c.presence >= c.wisdom && c.presence >= c.shadow) return 'presence';
  if (c.wisdom >= c.presence && c.wisdom >= c.shadow) return 'wisdom';
  return 'shadow';
}

function axisAlignmentScore(c: ComplexionVector): number {
  const total = Math.max(1, c.presence + c.wisdom + c.shadow);
  const d = dominantAxis(c);
  const raw = d === 'presence' ? c.presence : d === 'wisdom' ? c.wisdom : c.shadow;
  return clamp01(raw / total * 1.8);
}

function evaluateFriction(input: ActivationInput) {
  const timeFriction = input.context.dwellMinutes >= 0.5;
  const spaceFriction = (input.context.displacementMeters ?? 0) >= 40;
  const z = input.zoneConsciousness;
  const existentialFriction = z != null && (
    z.entropy > 0.72 ||
    z.unresolvedThreads >= 3 ||
    z.guardianDecay > 0.68 ||
    (z.resonance < 0.18 && axisAlignmentScore(input.complexion) < 0.34)
  );
  const passed = timeFriction || spaceFriction || existentialFriction;

  return {
    time: timeFriction,
    space: spaceFriction,
    existential: existentialFriction,
    passed,
  };
}

export function evaluateSituationalActivation(input: ActivationInput): ActivationResult {
  const friction = evaluateFriction(input);
  if (!friction.passed) {
    return {
      isOpen: false,
      refusalLine: 'The place remains closed.',
      friction,
      validActs: [],
      opacityReduction: 0,
      transformationPotential: 0,
    };
  }

  const canonicalActs = CANONICAL_BY_ARTIFACT[input.artifactType] ?? ['Witness'];
  const cWeight = contextWeight(input.context);
  const sWeight = semanticWeight(input.semanticsTags);

  const validActs = canonicalActs.map((act) => {
    const axis = axisForAct(act);
    const xWeight = complexionWeight(axis, input.complexion);
    const intensity = clamp01(0.4 * xWeight + 0.35 * cWeight + 0.25 * sWeight);
    return {
      act,
      intensity,
      transformationAxis: axis,
    };
  }).sort((a, b) => b.intensity - a.intensity);

  const top = validActs[0]?.intensity ?? 0;
  const avg = validActs.length > 0
    ? validActs.reduce((sum, a) => sum + a.intensity, 0) / validActs.length
    : 0;

  // Presence reveals the city by lowering opacity rather than unlocking fixed content.
  const opacityReduction = clamp01(0.2 * top + 0.5 * avg + 0.3 * cWeight);
  const transformationPotential = clamp01(0.5 * avg + 0.5 * sWeight);

  return {
    isOpen: true,
    friction,
    validActs,
    opacityReduction,
    transformationPotential,
  };
}
