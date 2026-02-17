/**
 * ARCHE Whisper System
 *
 * Transient poetic feedback. No numbers, no metrics.
 * Shows for 4-8 seconds, fades smoothly.
 * Cannot stack - one whisper at a time.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface WhisperState {
  text: string;
  visible: boolean;
  fadeOut: boolean;
}

interface WhisperContextType {
  /** Show a whisper message */
  show: (text: string, durationMs?: number) => void;
  /** Current whisper state (for the Whisper component) */
  state: WhisperState;
}

const WhisperContext = createContext<WhisperContextType | null>(null);

const DEFAULT_DURATION_MS = 5000;
const FADE_DURATION_MS = 1000;

export function WhisperProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WhisperState>({
    text: '',
    visible: false,
    fadeOut: false,
  });

  const show = useCallback((text: string, durationMs = DEFAULT_DURATION_MS) => {
    // Clear any existing whisper immediately
    setState({ text, visible: true, fadeOut: false });

    // Start fade out after duration
    const fadeTimer = setTimeout(() => {
      setState((prev) => ({ ...prev, fadeOut: true }));
    }, durationMs);

    // Hide completely after fade completes
    const hideTimer = setTimeout(() => {
      setState({ text: '', visible: false, fadeOut: false });
    }, durationMs + FADE_DURATION_MS);

    // Cleanup on re-show
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <WhisperContext.Provider value={{ show, state }}>
      {children}
    </WhisperContext.Provider>
  );
}

export function useWhisper() {
  const context = useContext(WhisperContext);
  if (!context) {
    throw new Error('useWhisper must be used within a WhisperProvider');
  }
  return context;
}

/**
 * Whisper display component.
 * Renders the current whisper as a fixed overlay.
 * Place this once at the app root level.
 */
export function Whisper() {
  const { state } = useWhisper();

  if (!state.visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'max(80px, env(safe-area-inset-bottom, 80px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: 'calc(100vw - 48px)',
        padding: '14px 24px',
        background: 'rgba(250, 248, 242, 0.95)',
        border: '1px solid rgba(0, 61, 44, 0.1)',
        borderRadius: 4,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        opacity: state.fadeOut ? 0 : 1,
        transition: `opacity ${FADE_DURATION_MS}ms ease-out`,
        pointerEvents: 'none',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
          fontSize: 'clamp(14px, 2.5vw, 16px)',
          fontStyle: 'italic',
          color: '#1A1A1A',
          textAlign: 'center',
          lineHeight: 1.5,
          margin: 0,
          opacity: 0.8,
        }}
      >
        {state.text}
      </p>
    </div>
  );
}
