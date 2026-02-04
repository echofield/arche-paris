import { useEffect, useRef } from 'react';

const STACK_KEY = 'arche_hash_stack';
const STACK_CAP = 20;

function getStack(): string[] {
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStack(stack: string[]) {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-STACK_CAP)));
  } catch {
    /* ignore */
  }
}

function getCurrentHash(): string {
  return window.location.hash.slice(1);
}

interface BackButtonProps {
  onClick?: () => void;
  onBack?: () => void;
  label?: string;
  fallbackHref?: string;
}

/**
 * BACK BUTTON — Hash stack navigation.
 * Pushes hash on hashchange (cap 20). On click: pop current, go to previous hash; fallback if stack empty.
 */
export function BackButton({ onClick, onBack, label = 'Retour à la cité', fallbackHref = '#etudes' }: BackButtonProps) {
  const navigatingBackRef = useRef(false);

  useEffect(() => {
    const syncOrPush = (hash: string) => {
      if (navigatingBackRef.current) {
        navigatingBackRef.current = false;
        return;
      }
      const stack = getStack();
      if (hash && stack[stack.length - 1] !== hash) {
        setStack([...stack, hash]);
      }
    };

    syncOrPush(getCurrentHash());
    const onHashChange = () => syncOrPush(getCurrentHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (onBack) {
      onBack();
      return;
    }

    const stack = getStack();
    if (stack.length <= 1) {
      const target = fallbackHref?.startsWith('#') ? fallbackHref : `#${fallbackHref || 'etudes'}`;
      window.location.hash = target;
      return;
    }

    stack.pop();
    const previous = stack[stack.length - 1];
    setStack(stack);
    navigatingBackRef.current = true;
    window.location.hash = previous ? `#${previous}` : fallbackHref?.startsWith('#') ? fallbackHref : `#${fallbackHref || 'etudes'}`;
  };

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
