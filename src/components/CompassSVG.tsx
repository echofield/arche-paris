/**
 * ARCHÉ — Compass as instrument: circle, cardinal marks, needle that rotates.
 * Same artistic direction: #003D2C, #6B6455, minimal. No gamified look.
 */

interface CompassSVGProps {
  /** Bearing in degrees (0 = north, 90 = east). Needle points toward target. */
  bearing: number;
  /** Size in px. Default 80. */
  size?: number;
}

const DEFAULT_SIZE = 80;

export function CompassSVG({ bearing, size = DEFAULT_SIZE }: CompassSVGProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const needleLen = r * 0.85;
  const stroke = '#003D2C';
  const strokeLight = '#6B6455';
  const fill = 'transparent';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', margin: '0 auto' }}
      aria-hidden
    >
      {/* Outer circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.2}
        opacity={0.9}
      />
      {/* Inner tick circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.92}
        fill="none"
        stroke={strokeLight}
        strokeWidth={0.6}
        opacity={0.5}
      />
      {/* Cardinal ticks: N, E, S, W (long) */}
      <g stroke={stroke} strokeWidth={1} opacity={0.8}>
        <line x1={cx} y1={cy - r} x2={cx} y2={cy - r + 6} />
        <line x1={cx + r} y1={cy} x2={cx + r - 6} y2={cy} />
        <line x1={cx} y1={cy + r} x2={cx} y2={cy + r - 6} />
        <line x1={cx - r} y1={cy} x2={cx - r + 6} y2={cy} />
      </g>
      {/* N label — small, top */}
      <text
        x={cx}
        y={cy - r - 4}
        textAnchor="middle"
        fill={strokeLight}
        fontSize={8}
        fontFamily="var(--font-sans)"
        opacity={0.7}
      >
        N
      </text>
      {/* Needle: rotates so 0° = needle points up (north). Bearing = direction to target, so needle points at bearing. */}
      <g transform={`translate(${cx}, ${cy}) rotate(${bearing})`}>
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={-needleLen}
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={needleLen * 0.35}
          stroke={strokeLight}
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.7}
        />
      </g>
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2} fill={stroke} opacity={0.6} />
    </svg>
  );
}
