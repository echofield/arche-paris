/**
 * ARCHÉ SYMBOL — Pure presence
 *
 * Extracted from arch-citizen Blason component
 *
 * Rules:
 * - No enlargement
 * - No animation
 * - No glow
 * - No effect
 * - Pure presence only
 */

interface ArcheSymbolProps {
  size?: number;
  onClick?: () => void;
}

export function ArcheSymbol({ size = 40, onClick }: ArcheSymbolProps) {
  const height = size * 1.24; // Maintain aspect ratio

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
        style={{
          display: 'block'
        }}
      >
        {/* Contour du blason */}
        <path
          d="M 25 2 L 45 10 L 45 40 Q 45 52 25 60 Q 5 52 5 40 L 5 10 Z"
          fill="rgba(250, 248, 245, 0.9)"
          stroke="#B8860B"
          strokeWidth="0.5"
          opacity="0.85"
        />

        {/* Colonne centrale stylisee */}
        <line
          x1="25"
          y1="15"
          x2="25"
          y2="45"
          stroke="#B8860B"
          strokeWidth="1.2"
          opacity="0.6"
        />

        {/* Chapiteau (haut de colonne) */}
        <path
          d="M 22 15 L 28 15 M 21 17 L 29 17"
          stroke="#B8860B"
          strokeWidth="0.6"
          opacity="0.5"
        />

        {/* Base de colonne */}
        <path
          d="M 22 45 L 28 45 M 21 47 L 29 47"
          stroke="#B8860B"
          strokeWidth="0.6"
          opacity="0.5"
        />

        {/* Lions stylises — Gauche */}
        <path
          d="M 12 28 Q 10 26 12 24 L 14 26 Z"
          fill="#B8860B"
          opacity="0.35"
        />

        {/* Lions stylises — Droite */}
        <path
          d="M 38 28 Q 40 26 38 24 L 36 26 Z"
          fill="#B8860B"
          opacity="0.35"
        />

        {/* Le cercle central */}
        <circle
          cx="25"
          cy="31"
          r="6"
          fill="transparent"
          stroke="#B8860B"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
}
