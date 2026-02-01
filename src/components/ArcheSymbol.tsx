/**
 * ARCHÉ SYMBOL — Quiet luxury
 *
 * Minimal contour-only glyph. No fill, just refined lines.
 * Subtle presence at the boundary.
 */

interface ArcheSymbolProps {
  size?: number;
  onClick?: () => void;
}

export function ArcheSymbol({ size = 32, onClick }: ArcheSymbolProps) {
  const height = size * 1.24;

  return (
    <div
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${height}px`,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <svg
        width={size}
        height={height}
        viewBox="0 0 50 62"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* Shield contour only — no fill */}
        <path
          d="M 25 2 L 45 10 L 45 40 Q 45 52 25 60 Q 5 52 5 40 L 5 10 Z"
          fill="none"
          stroke="#B8860B"
          strokeWidth="0.6"
          opacity="0.5"
        />

        {/* Central circle — the only interior element */}
        <circle
          cx="25"
          cy="31"
          r="5"
          fill="none"
          stroke="#B8860B"
          strokeWidth="0.5"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
