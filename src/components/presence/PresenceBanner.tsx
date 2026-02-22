/**
 * ARCHÉ — Universal presence outcome line.
 * Text + optional tiny button only; no box/card. Reuses established serif inline tone.
 */
import type { PresenceState } from '@/lib/presence';
import type { PresenceVerifyResponse } from '@/lib/presence';

export interface PresenceBannerProps {
  state: PresenceState;
  interference?: boolean;
  lastResponse?: PresenceVerifyResponse | null;
  error?: string | null;
  variant?: 'inline' | 'overlay';
  onRecalibrate?: () => void;
  onRetry?: () => void;
  /** t(key) */
  t: (key: string) => string;
}

const messageLineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif), "Cormorant Garamond", Georgia, serif',
  fontSize: 13,
  fontStyle: 'italic',
  opacity: 0.45,
  color: '#1A1A1A',
  margin: 0,
  lineHeight: 1.5,
};

const actionButtonStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans), "Inter", system-ui, sans-serif',
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#003D2C',
  opacity: 0.5,
  background: 'transparent',
  border: 'none',
  padding: '6px 0',
  marginTop: 6,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

function getMessageKey(
  state: PresenceState,
  interference: boolean,
  lastResponse: PresenceVerifyResponse | null | undefined
): string | null {
  if (lastResponse?.reasonCode === 'TELEPORT') return 'presence.teleport';
  if (lastResponse?.reasonCode === 'COOLDOWN') return 'treasure.buttons.heartbeat';
  if (interference) return 'presence.interference';
  if (state === 'WARMING') return 'presence.stabilisation';
  if (state === 'SEARCHING') return 'presence.searching';
  if (state === 'UNSTABLE') return 'presence.uncertain';
  if (state === 'ANCHORED') return 'presence.recognized';
  return null;
}

function showRecalibrateButton(
  state: PresenceState,
  interference: boolean,
  reasonCode: string | undefined
): boolean {
  if (reasonCode === 'COOLDOWN') return false;
  return state === 'UNSTABLE' || interference;
}

export function PresenceBanner({
  state,
  interference = false,
  lastResponse = null,
  variant = 'inline',
  onRecalibrate,
  onRetry,
  t,
}: PresenceBannerProps) {
  const messageKey = getMessageKey(state, interference, lastResponse);
  if (messageKey == null) return null;

  const showButton = showRecalibrateButton(state, interference, lastResponse?.reasonCode);
  const handleAction = onRecalibrate ?? onRetry;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginTop: variant === 'overlay' ? 12 : 4,
      }}
    >
      <p style={messageLineStyle}>{t(messageKey)}</p>
      {showButton && handleAction && (
        <button type="button" onClick={handleAction} style={actionButtonStyle}>
          {t('presence.recalibrate')}
        </button>
      )}
    </div>
  );
}

export default PresenceBanner;
