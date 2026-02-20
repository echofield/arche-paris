import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComplexionData, WorldSnapshotData } from '../lib/api';

export type AuraField = {
  clarity: number;
  shadow: number;
  anchor: number;
  movement: number;
  echo: number;
  alignment: number;
};

export type AuraFieldEvolution = Partial<Record<keyof AuraField, number>>;

export type AuraFieldModel = {
  field: AuraField;
  evolution: AuraFieldEvolution;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function deriveAuraFieldModel(
  snapshot: WorldSnapshotData | null,
  complexion: ComplexionData | null,
  currentH3: string | null
): AuraFieldModel {
  const h3 = currentH3 ?? 'PAR-10';
  const zone = snapshot?.world.zones.find((z) => z.h3 === h3) ?? null;
  const meZone = snapshot?.me.zones?.[h3] ?? null;

  const pulses = meZone?.presence?.pulses_20m ?? 0;
  const inscriptions = zone?.signals?.inscriptions_recent ?? 0;
  const champRecent = zone?.signals?.champ_recent ?? 0;
  const anchors = zone?.anchors ?? [];
  const lawEntries = Object.values(zone?.law ?? {});

  const allowedCount = lawEntries.filter((l) => Boolean(l?.allowed)).length;
  const blockedCount = lawEntries.length - allowedCount;
  const verdictTotal = Math.max(1, lawEntries.length);

  const totalPoints = Math.max(
    1,
    (complexion?.presence_points ?? 0) + (complexion?.wisdom_points ?? 0) + (complexion?.shadow_points ?? 0)
  );

  const presenceRatio = (complexion?.presence_points ?? 0) / totalPoints;
  const wisdomRatio = (complexion?.wisdom_points ?? 0) / totalPoints;
  const shadowRatio = (complexion?.shadow_points ?? 0) / totalPoints;

  const structuralAnchors = anchors.filter((a) => {
    const t = (a?.type ?? '').toLowerCase();
    return t.includes('struct') || t.includes('threshold') || t.includes('axis') || t.includes('meridian');
  }).length;

  const anchor = clamp01(pulses / 10);
  const movement = clamp01(1 - anchor * 0.8);
  const echo = clamp01((inscriptions + champRecent) / 12);
  const clarity = clamp01(allowedCount / verdictTotal * 0.6 + wisdomRatio * 0.4);
  const shadow = clamp01(blockedCount / verdictTotal * 0.6 + shadowRatio * 0.4);
  const alignment = clamp01(
    (anchors.length > 0 ? structuralAnchors / anchors.length : 0.5) * 0.6 + presenceRatio * 0.4
  );

  const dPresence = Number((complexion?.last_delta?.d_presence as number) ?? 0);
  const dWisdom = Number((complexion?.last_delta?.d_wisdom as number) ?? 0);
  const dShadow = Number((complexion?.last_delta?.d_shadow as number) ?? 0);
  const evolution: AuraFieldEvolution = {
    anchor: dPresence,
    movement: -dPresence,
    clarity: dWisdom,
    shadow: dShadow,
    echo: (dWisdom + dPresence) * 0.5,
    alignment: (dPresence + dWisdom - dShadow) / 3,
  };

  return {
    field: { clarity, shadow, anchor, movement, echo, alignment },
    evolution,
  };
}

function useAnimatedAuraField(target: AuraField, durationMs: number = 4000): AuraField {
  const [displayed, setDisplayed] = useState<AuraField>(target);
  const currentRef = useRef<AuraField>(target);
  const animRef = useRef({ start: target, startTime: 0, target });
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reducedMotion) {
      currentRef.current = target;
      setDisplayed(target);
      return;
    }

    animRef.current = {
      start: currentRef.current,
      startTime: performance.now(),
      target,
    };

    let frameId = 0;
    const tick = (now: number) => {
      const { start, startTime, target: t } = animRef.current;
      let progress = (now - startTime) / durationMs;
      if (progress >= 1) progress = 1;
      const ease = 1 - Math.pow(1 - progress, 4);
      const nextField: AuraField = {
        clarity: start.clarity + (t.clarity - start.clarity) * ease,
        shadow: start.shadow + (t.shadow - start.shadow) * ease,
        anchor: start.anchor + (t.anchor - start.anchor) * ease,
        movement: start.movement + (t.movement - start.movement) * ease,
        echo: start.echo + (t.echo - start.echo) * ease,
        alignment: start.alignment + (t.alignment - start.alignment) * ease,
      };
      currentRef.current = nextField;
      setDisplayed(nextField);
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [target, durationMs, reducedMotion]);

  return displayed;
}

function formatPercent01(value: number): string {
  return `${Math.round(clamp01(value) * 100)}%`;
}

function formatDelta(value: number | undefined): string {
  const v = Number(value ?? 0);
  if (!Number.isFinite(v) || v === 0) return '0.00';
  return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
}

const AXIS_CONFIG: Array<{ key: keyof AuraField; label: string }> = [
  { key: 'clarity', label: 'Clarte' },
  { key: 'anchor', label: 'Ancrage' },
  { key: 'alignment', label: 'Alignement' },
  { key: 'shadow', label: 'Ombre' },
  { key: 'movement', label: 'Mouvement' },
  { key: 'echo', label: 'Echo' },
];

export function AuraFieldDiagram({ model }: { model: AuraFieldModel }) {
  const animatedField = useAnimatedAuraField(model.field, 4000);
  const size = 210;
  const center = size / 2;
  const maxRadius = 82;
  const angles = [
    -Math.PI / 2,
    -Math.PI / 6,
    Math.PI / 6,
    Math.PI / 2,
    (5 * Math.PI) / 6,
    (-5 * Math.PI) / 6,
  ];

  const values = useMemo(
    () => [
      animatedField.clarity,
      animatedField.anchor,
      animatedField.alignment,
      animatedField.shadow,
      animatedField.movement,
      animatedField.echo,
    ],
    [animatedField]
  );

  const polygonPoints = values
    .map((v, idx) => {
      const r = clamp01(v) * maxRadius;
      const x = center + r * Math.cos(angles[idx]);
      const y = center + r * Math.sin(angles[idx]);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ width: '100%', maxWidth: 360, margin: '0 auto 14px' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <g stroke="#003D2C" strokeWidth="0.6" strokeOpacity="0.14">
          {angles.map((angle, i) => (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(angle)}
              y2={center + maxRadius * Math.sin(angle)}
            />
          ))}
        </g>
        <g stroke="#003D2C" strokeWidth="0.5" strokeOpacity="0.1" fill="none">
          {[0.2, 0.4, 0.6, 0.8, 1].map((rPct) => (
            <polygon
              key={`web-${rPct}`}
              points={angles.map((a) => {
                const r = rPct * maxRadius;
                return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`;
              }).join(' ')}
            />
          ))}
        </g>
        <polygon
          points={polygonPoints}
          fill="#007850"
          fillOpacity="0.09"
          stroke="#007850"
          strokeWidth="1.2"
          strokeOpacity="0.75"
          strokeLinejoin="round"
        />
        <g fill="#007850" fillOpacity="0.88">
          {values.map((v, idx) => {
            const r = clamp01(v) * maxRadius;
            const x = center + r * Math.cos(angles[idx]);
            const y = center + r * Math.sin(angles[idx]);
            return <circle key={`node-${idx}`} cx={x} cy={y} r="1.6" />;
          })}
        </g>
      </svg>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 8,
          marginTop: 8,
        }}
      >
        {AXIS_CONFIG.map((axis) => (
          <div
            key={axis.key}
            style={{
              border: '1px solid rgba(0,61,44,0.1)',
              borderRadius: 6,
              padding: '6px 8px',
              background: 'rgba(0,61,44,0.02)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#6B6455', letterSpacing: '0.04em' }}>
              {axis.label}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#003D2C' }}>
                {formatPercent01(model.field[axis.key])}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#1A1A1A', opacity: 0.72 }}>
                {formatDelta(model.evolution[axis.key])}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

