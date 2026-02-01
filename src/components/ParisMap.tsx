/**
 * ParisMap — stroke-only Paris arrondissements map.
 * No pins, no labels, no GPS. Optional breathing animation (CSS-only, respects prefers-reduced-motion).
 */

import { useCallback } from 'react';

// Stroke-only Paris arrondissement paths (escargot); same geometry as CollectionMap, labels omitted
const PARIS_PATHS: { path: string }[] = [
  { path: 'M360,280 L390,275 L395,300 L385,320 L360,315 Z' },
  { path: 'M390,275 L420,270 L425,295 L395,300 Z' },
  { path: 'M420,270 L460,280 L455,310 L425,295 Z' },
  { path: 'M395,300 L425,295 L455,310 L450,340 L410,350 L385,320 Z' },
  { path: 'M385,320 L410,350 L420,390 L380,400 L350,370 L360,315 Z' },
  { path: 'M310,340 L360,315 L350,370 L380,400 L340,420 L290,380 Z' },
  { path: 'M220,310 L310,340 L290,380 L340,420 L280,450 L200,400 L180,340 Z' },
  { path: 'M250,220 L330,240 L360,280 L310,340 L220,310 L180,340 L170,280 L200,230 Z' },
  { path: 'M330,240 L380,230 L390,275 L360,280 Z' },
  { path: 'M380,230 L460,210 L480,250 L460,280 L420,270 L390,275 Z' },
  { path: 'M460,280 L520,270 L540,330 L500,370 L450,340 L455,310 Z' },
  { path: 'M450,340 L500,370 L540,330 L600,380 L580,480 L480,450 L420,390 L410,350 Z' },
  { path: 'M380,400 L420,390 L480,450 L500,520 L400,540 L350,480 Z' },
  { path: 'M280,450 L340,420 L380,400 L350,480 L400,540 L320,560 L250,500 Z' },
  { path: 'M120,380 L200,400 L280,450 L250,500 L320,560 L200,570 L100,500 Z' },
  { path: 'M80,240 L170,280 L180,340 L120,380 L100,500 L60,420 L40,320 Z' },
  { path: 'M170,120 L280,140 L330,180 L330,240 L250,220 L200,230 L170,280 L80,240 L100,160 Z' },
  { path: 'M280,140 L380,120 L430,150 L460,210 L380,230 L330,240 L330,180 Z' },
  { path: 'M430,150 L540,140 L600,200 L560,250 L520,270 L460,280 L480,250 L460,210 Z' },
  { path: 'M520,270 L560,250 L600,200 L640,280 L600,380 L540,330 Z' }
];

const VIEWBOX = '40 100 620 480';

export type ParisMapProps = {
  className?: string;
  onTap?: () => void;
  breathing?: boolean;
};

export function ParisMap({ className, onTap, breathing = true }: ParisMapProps) {
  const handleClick = useCallback(() => {
    onTap?.();
  }, [onTap]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTap?.();
      }
    },
    [onTap]
  );

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onTap ? 'pointer' : 'default'
      }}
      onClick={onTap ? handleClick : undefined}
      onKeyDown={onTap ? handleKeyDown : undefined}
      role={onTap ? 'button' : undefined}
      tabIndex={onTap ? 0 : undefined}
      aria-label={onTap ? 'Open map menu' : undefined}
    >
      <div
        className={breathing ? 'paris-map-breathe' : undefined}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          viewBox={VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', maxHeight: '100%' }}
          aria-hidden
        >
          <g fill="none" stroke="#003D2C" strokeWidth="0.8" strokeLinejoin="round">
            {PARIS_PATHS.map(({ path }, i) => (
              <path key={i} d={path} />
            ))}
          </g>
        </svg>
      </div>
      {breathing && (
        <style>{`
          .paris-map-breathe {
            animation: paris-map-breathe 5s ease-in-out infinite alternate;
          }
          @media (prefers-reduced-motion: reduce) {
            .paris-map-breathe {
              animation: none;
            }
          }
          @keyframes paris-map-breathe {
            from { transform: scale(1); opacity: 0.96; }
            to   { transform: scale(1.012); opacity: 1; }
          }
        `}</style>
      )}
    </div>
  );
}
