/**
 * BOUSSOLE — Point d'entrée vers FIELD MODE
 * N · E · S · W
 */

interface BoussoleProps {
  onClick: () => void;
}

export function Boussole({ onClick }: BoussoleProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '40px',
        left: '40px',
        width: '48px',
        height: '48px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        zIndex: 1000,
        padding: 0
      }}
      aria-label="Field Mode"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'breathe 8s ease-in-out infinite'
        }}
      >
        {/* Cercle extérieur */}
        <circle
          cx="24"
          cy="24"
          r="18"
          stroke="#1A1A1A"
          strokeWidth="0.5"
          opacity="0.15"
        />

        {/* Points cardinaux */}
        {/* N */}
        <text
          x="24"
          y="10"
          textAnchor="middle"
          fontSize="8"
          fontFamily="Inter, sans-serif"
          fontWeight="400"
          fill="#1A1A1A"
          opacity="0.4"
        >
          N
        </text>

        {/* E */}
        <text
          x="38"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontFamily="Inter, sans-serif"
          fontWeight="400"
          fill="#1A1A1A"
          opacity="0.4"
        >
          E
        </text>

        {/* S */}
        <text
          x="24"
          y="42"
          textAnchor="middle"
          fontSize="8"
          fontFamily="Inter, sans-serif"
          fontWeight="400"
          fill="#1A1A1A"
          opacity="0.4"
        >
          S
        </text>

        {/* W */}
        <text
          x="10"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontFamily="Inter, sans-serif"
          fontWeight="400"
          fill="#1A1A1A"
          opacity="0.4"
        >
          W
        </text>

        {/* Aiguille centrale */}
        <line
          x1="24"
          y1="24"
          x2="24"
          y2="12"
          stroke="#003D2C"
          strokeWidth="1"
          opacity="0.6"
          style={{
            animation: 'rotate 12s linear infinite',
            transformOrigin: 'center'
          }}
        />

        {/* Point central */}
        <circle
          cx="24"
          cy="24"
          r="1.5"
          fill="#003D2C"
          opacity="0.5"
        />
      </svg>

      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
