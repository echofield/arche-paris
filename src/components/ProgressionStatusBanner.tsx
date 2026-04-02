import { useEffect, useMemo, useState } from 'react';
import { reconcileCardScopedProgression } from '../utils/progression-reconcile';
import {
  clearProgressionUxIssue,
  getProgressionUxIssue,
  subscribeToProgressionUxIssue,
  type ProgressionUxIssue,
} from '../utils/progression-ux-state';

interface ProgressionStatusBannerProps {
  cardId: string | null;
}

function fallbackMessage(issue: ProgressionUxIssue): string {
  if (issue.message.trim().length > 0) return issue.message;

  switch (issue.code) {
    case 'STALE_BASE_VERSION_CONFLICT':
      return 'A newer progression snapshot exists on server. Resync is required before retry.';
    case 'RECONCILE_REQUIRED':
      return 'Progression conflict detected. Resync required.';
    case 'LOCAL_DIRTY_DEFERRED':
      return 'Local progression changes are pending. Sync is deferred until local writes settle.';
    case 'LOCAL_FALLBACK_MODE':
      return 'Server is unavailable. Progression remains local and will retry automatically.';
    default:
      return 'Progression sync needs attention.';
  }
}

export function ProgressionStatusBanner({ cardId }: ProgressionStatusBannerProps) {
  const [issue, setIssue] = useState(() => getProgressionUxIssue(cardId));
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryInfo, setRetryInfo] = useState<string | null>(null);

  useEffect(() => {
    setIssue(getProgressionUxIssue(cardId));
    setRetryInfo(null);

    const unsub = subscribeToProgressionUxIssue(() => {
      setIssue(getProgressionUxIssue(cardId));
    });

    return unsub;
  }, [cardId]);

  const visibleIssue = useMemo(() => {
    if (!cardId) return null;
    if (!issue) return null;
    if (issue.cardId !== cardId) return null;
    return issue;
  }, [cardId, issue]);

  if (!visibleIssue) return null;

  const retryLabel =
    visibleIssue.code === 'LOCAL_DIRTY_DEFERRED'
      ? 'Retry sync'
      : 'Resync now';

  const handleRetry = async () => {
    if (!cardId || isRetrying) return;

    setIsRetrying(true);
    setRetryInfo(null);

    try {
      const result = await reconcileCardScopedProgression(cardId, 'ui.banner.retry');
      if (result.status === 'applied' || (result.status === 'skipped' && result.reason === 'up_to_date')) {
        clearProgressionUxIssue(cardId);
        setRetryInfo('Progression synchronized.');
      } else if (result.status === 'deferred') {
        setRetryInfo('Sync deferred: local writes are still pending.');
      } else if (result.status === 'conflict') {
        setRetryInfo('Conflict remains. Keep the app online and retry shortly.');
      } else {
        setRetryInfo('Sync skipped.');
      }
    } catch (error) {
      setRetryInfo(error instanceof Error ? error.message : 'Reconcile failed.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 10020,
        maxWidth: 360,
        background: 'rgba(255, 248, 226, 0.98)',
        border: '1px solid rgba(158, 106, 18, 0.35)',
        color: '#5a3b00',
        borderRadius: 6,
        padding: '10px 12px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Progression Sync Notice</div>
      <div>{fallbackMessage(visibleIssue)}</div>
      {retryInfo && <div style={{ marginTop: 6, opacity: 0.9 }}>{retryInfo}</div>}
      {visibleIssue.recoverable && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          style={{
            marginTop: 8,
            border: '1px solid rgba(158, 106, 18, 0.4)',
            background: '#fff',
            color: '#5a3b00',
            borderRadius: 4,
            padding: '6px 10px',
            fontSize: 12,
            cursor: isRetrying ? 'default' : 'pointer',
            opacity: isRetrying ? 0.7 : 1,
          }}
        >
          {isRetrying ? 'Syncing...' : retryLabel}
        </button>
      )}
    </div>
  );
}
