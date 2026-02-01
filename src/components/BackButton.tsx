interface BackButtonProps {
  onClick: () => void;
  onBack?: () => void;
  label?: string;
}

/**
 * BACK BUTTON — Aligned with arch-citizen
 * Glyph is hidden on sub-pages (App.tsx) so BackButton has top-left to itself.
 * Label "Retour à la cité" by default; clear spacing from icon.
 */
export function BackButton({ onClick, onBack, label = 'Retour à la cité' }: BackButtonProps) {
  const handleClick = onBack ?? onClick;

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: 'clamp(20px, 4vw, 32px)',
        left: 'clamp(24px, 4vw, 40px)',
        background: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: 'clamp(11px, 2vw, 13px)',
        color: '#6B6455',
        cursor: 'pointer',
        opacity: 0.5,
        transition: 'opacity 400ms ease',
        zIndex: 1000,
        fontFamily: 'var(--font-serif)',
        letterSpacing: '0.05em',
        padding: '8px 12px',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
      onTouchStart={(e) => (e.currentTarget.style.opacity = '0.9')}
      onTouchEnd={(e) => (e.currentTarget.style.opacity = '0.5')}
    >
      <span style={{ fontSize: 'clamp(16px, 3vw, 20px)', flexShrink: 0 }}>‹</span>
      <span className="back-label" style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}
