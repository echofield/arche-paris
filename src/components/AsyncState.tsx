/**
 * AUDIT 2025-02-23: Standardized loading/error UI to prevent dead ends (DESIGN_PHILOSOPHY).
 * Wrap heavy screens' content; always offer retry or back so the user is never stuck.
 */
import { useTranslation } from '../utils/i18n';

export interface AsyncStateProps {
  loading?: boolean;
  error?: { title?: string; message: string } | null;
  onRetry?: () => void;
  onBack?: () => void;
  children?: React.ReactNode;
}

const blockStyle: React.CSSProperties = {
  minHeight: 120,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 32,
  textAlign: 'center',
  fontFamily: 'var(--font-serif)',
  color: 'var(--ink, #1A1A1A)',
};

export function AsyncState({ loading, error, onRetry, onBack, children }: AsyncStateProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div style={blockStyle}>
        <span style={{ fontSize: 15, opacity: 0.6 }}>{t('async.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={blockStyle}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          {error.title ?? t('async.errorTitle')}
        </p>
        <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>{error.message}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                padding: '10px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'transparent',
                border: '1px solid #003D2C',
                color: '#003D2C',
                cursor: 'pointer',
              }}
            >
              {t('async.retry')}
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: '10px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'transparent',
                border: '1px solid #003D2C',
                color: '#003D2C',
                cursor: 'pointer',
              }}
            >
              {t('async.back')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
