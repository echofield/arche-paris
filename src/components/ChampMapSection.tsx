/**
 * ChampMapSection — Layered observatory map for Le Champ
 *
 * IMPORTANT: CarteInteractive must NEVER be modified.
 * All overlays and interactions live here.
 */

import { useMemo } from 'react';
import { CarteInteractive, type MapVariant } from './CarteInteractive';
import type { ChampLayerMode } from './ChampScreen/LayerToggles';
import { CITY_AXES, getAxisArrondissementSequence } from '../data/axes';

export type FieldItem = {
  id: string;
  arrondissement: number;
  textExcerpt: string;
  timeLabel: string;
};

export interface ResonancePlace {
  id: string;
  name: string;
  x: number;
  y: number;
  weight?: number;
  isAnchor?: boolean;
}

export interface ArrondissementCount {
  arrondissement: number;
  count: number;
}

export interface AxisMarker {
  axisIndex: number;
  axisName: string;
  arrondissement: number;
}

export type ChampMapSectionProps = {
  activeLayers: Set<ChampLayerMode>;
  resonancePlaces: ResonancePlace[];
  aujourdhuiCounts: ArrondissementCount[];
  invisibleCounts: ArrondissementCount[];
  axisMarkers?: AxisMarker[];
  highlightArr: number | null;
  onPlaceSelect?: (place: ResonancePlace) => void;
  onArrTap?: (arr: number, layer: 'aujourdhui' | 'invisible') => void;
  onAxisTap?: (axisIndex: number) => void;
  mapVariant?: MapVariant;
};

const VIEWBOX = { w: 2037.566, h: 1615.5 };

const ARRONDISSEMENT_CENTERS: Record<number, { x: number; y: number }> = {
  1:  { x: 980, y: 720 },
  2:  { x: 1020, y: 640 },
  3:  { x: 1100, y: 680 },
  4:  { x: 1120, y: 760 },
  5:  { x: 1050, y: 880 },
  6:  { x: 920, y: 870 },
  7:  { x: 780, y: 820 },
  8:  { x: 820, y: 600 },
  9:  { x: 950, y: 540 },
  10: { x: 1100, y: 520 },
  11: { x: 1200, y: 720 },
  12: { x: 1350, y: 900 },
  13: { x: 1100, y: 1050 },
  14: { x: 900, y: 1020 },
  15: { x: 680, y: 920 },
  16: { x: 550, y: 680 },
  17: { x: 700, y: 450 },
  18: { x: 920, y: 380 },
  19: { x: 1180, y: 400 },
  20: { x: 1300, y: 580 },
};

export function ChampMapSection({
  activeLayers,
  resonancePlaces,
  aujourdhuiCounts,
  invisibleCounts,
  axisMarkers = [],
  highlightArr,
  onPlaceSelect,
  onArrTap,
  onAxisTap,
  mapVariant = 'draw',
}: ChampMapSectionProps) {

  const aujourdhuiMap = useMemo(() => {
    const m = new Map<number, number>();
    aujourdhuiCounts.forEach(c => m.set(c.arrondissement, c.count));
    return m;
  }, [aujourdhuiCounts]);

  const invisibleMap = useMemo(() => {
    const m = new Map<number, number>();
    invisibleCounts.forEach(c => m.set(c.arrondissement, c.count));
    return m;
  }, [invisibleCounts]);

  const axisPolylines = useMemo(() => {
    return CITY_AXES.map((axis, axisIndex) => {
      const seq = getAxisArrondissementSequence(axisIndex);
      const points = seq
        .map(arr => ARRONDISSEMENT_CENTERS[arr])
        .filter((p): p is { x: number; y: number } => p != null);
      return { axisIndex, points, strength: axis.strength };
    }).filter(p => p.points.length >= 2);
  }, []);

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: '100%',
      aspectRatio: `${VIEWBOX.w} / ${VIEWBOX.h}`,
    }}>
      <CarteInteractive variant={mapVariant} />

      <svg
        viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: 'auto', pointerEvents: 'none',
        }}
      >
        {/* Highlight arrondissement (from Presence bridge) */}
        {highlightArr && ARRONDISSEMENT_CENTERS[highlightArr] && (
          <circle
            cx={ARRONDISSEMENT_CENTERS[highlightArr].x}
            cy={ARRONDISSEMENT_CENTERS[highlightArr].y}
            r="120"
            fill="rgba(0,120,80,0.06)"
            stroke="rgba(0,120,80,0.15)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
        )}

        {/* Layer: Invisible — aggregated counts per arrondissement */}
        {activeLayers.has('invisible') && Array.from(invisibleMap.entries()).map(([arr, count]) => {
          const center = ARRONDISSEMENT_CENTERS[arr];
          if (!center || count === 0) return null;
          const r = Math.min(60, 20 + count * 4);
          return (
            <g key={`inv-${arr}`} style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={() => onArrTap?.(arr, 'invisible')}>
              <circle
                cx={center.x} cy={center.y} r={r}
                fill="rgba(0,61,44,0.06)"
                stroke="rgba(0,61,44,0.15)"
                strokeWidth="0.8"
              />
              <text
                x={center.x} y={center.y + 4}
                textAnchor="middle"
                fontFamily="var(--font-sans)"
                fontSize="18"
                fill="#003D2C"
                opacity="0.4"
              >
                {count}
              </text>
            </g>
          );
        })}

        {/* Layer: Axes — polylines connecting anchor arrondissements, tappable */}
        {activeLayers.has('axes') && axisPolylines.map(({ axisIndex, points, strength }) => {
          const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
          const strokeWidth = 1 + (strength / 5) * 1.5;
          const strokeOpacity = 0.2 + (strength / 5) * 0.35;
          return (
            <g
              key={`axis-line-${axisIndex}`}
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={() => onAxisTap?.(axisIndex)}
            >
              {/* Subtle animated glow (slow pulse) */}
              <polyline
                points={pointsStr}
                fill="none"
                stroke="rgba(107,76,138,0.4)"
                strokeWidth={strokeWidth + 6}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.25, animation: 'champ-axis-pulse 4s ease-in-out infinite' }}
              />
              {/* Main line: stroke opacity = strength */}
              <polyline
                points={pointsStr}
                fill="none"
                stroke="rgba(107,76,138,0.6)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: strokeOpacity }}
              />
              {/* Invisible wide stroke for easier tap target */}
              <polyline
                points={pointsStr}
                fill="none"
                stroke="transparent"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* Layer: Aujourd'hui — pulsing markers at arrondissement centers */}
        {activeLayers.has('aujourdhui') && Array.from(aujourdhuiMap.entries()).map(([arr, count]) => {
          const center = ARRONDISSEMENT_CENTERS[arr];
          if (!center || count === 0) return null;
          return (
            <g key={`ajd-${arr}`} style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={() => onArrTap?.(arr, 'aujourdhui')}>
              <circle
                cx={center.x} cy={center.y} r="18"
                fill="rgba(0,120,80,0.12)"
                style={{ animation: 'champ-aujourdhui-pulse 3s ease-in-out infinite' }}
              />
              <circle
                cx={center.x} cy={center.y} r="8"
                fill="#007850" opacity="0.7"
              />
              <text
                x={center.x} y={center.y - 26}
                textAnchor="middle"
                fontFamily="var(--font-sans)"
                fontSize="16" fontWeight="600"
                fill="#007850" opacity="0.8"
              >
                {count}
              </text>
            </g>
          );
        })}

        {/* Layer: Resonance — cultural halos at place coordinates */}
        {activeLayers.has('resonance') && resonancePlaces.map((place) => {
          const r = place.weight ? 12 + place.weight * 4 : 20;
          const anchor = place.isAnchor;
          return (
            <g key={`res-${place.id}`} style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={() => onPlaceSelect?.(place)}>
              <circle
                cx={place.x} cy={place.y} r={r + 10}
                fill={anchor ? 'rgba(139,105,20,0.10)' : 'rgba(139,105,20,0.06)'}
              />
              <circle
                cx={place.x} cy={place.y} r={r}
                fill={anchor ? 'rgba(139,105,20,0.18)' : 'rgba(139,105,20,0.12)'}
                stroke={anchor ? 'rgba(139,105,20,0.5)' : 'rgba(139,105,20,0.3)'}
                strokeWidth={anchor ? '1.6' : '0.8'}
              />
              <circle
                cx={place.x} cy={place.y} r={anchor ? '5' : '4'}
                fill={anchor ? 'rgba(139,105,20,0.85)' : 'rgba(139,105,20,0.6)'}
              />
            </g>
          );
        })}
      </svg>

      <style>{`
        @keyframes champ-aujourdhui-pulse {
          0%, 100% { opacity: 0.5; transform-origin: center; }
          50% { opacity: 1; }
        }
        @keyframes champ-axis-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
