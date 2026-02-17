/**
 * ZoneEntryFeedback — Visual feedback for zone entry validation
 * Shows GPS acquisition, submission, acceptance/rejection states
 */

import type { ZoneEntryStatus, ZoneEntryError } from '../hooks/useZoneEntry';

interface ZoneEntryFeedbackProps {
  status: ZoneEntryStatus;
  error: ZoneEntryError | null;
  zoneId: string | null;
  gpsData: {
    lat: number | null;
    lng: number | null;
    accuracy_m: number | null;
  };
  onClose: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  NO_GPS: 'Position GPS requise',
  BAD_COORDS: 'Coordonnées invalides',
  ACCURACY_TOO_LOW: 'Signal GPS trop faible',
  OUTSIDE_ZONE: 'Vous êtes hors de cette zone',
  ZONE_NOT_FOUND: 'Zone inconnue',
  GPS_FAILED: 'Impossible d\'obtenir votre position',
  MISSING_ZONE_ID: 'Zone non spécifiée',
  MISSING_IDEMPOTENCY_KEY: 'Erreur système',
};

export function ZoneEntryFeedback({
  status,
  error,
  zoneId,
  gpsData,
  onClose,
}: ZoneEntryFeedbackProps) {
  if (status === 'idle') return null;

  const arrNum = zoneId?.replace('PAR-', '');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10003,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
        padding: 24,
      }}
      onClick={status === 'accepted' || status === 'rejected' ? onClose : undefined}
    >
      <div
        style={{
          background: '#FAF8F2',
          border: '1px solid rgba(0,61,44,0.2)',
          borderRadius: 8,
          padding: 24,
          maxWidth: 320,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            margin: '0 auto 16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              status === 'accepted'
                ? 'rgba(0,120,80,0.12)'
                : status === 'rejected'
                ? 'rgba(180,50,50,0.12)'
                : 'rgba(0,61,44,0.08)',
          }}
        >
          {status === 'acquiring_gps' && (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#003D2C"
              strokeWidth="2"
              style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
              <circle cx="12" cy="12" r="3" fill="#003D2C" />
            </svg>
          )}
          {status === 'submitting' && (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#003D2C"
              strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          )}
          {status === 'accepted' && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007850" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {status === 'rejected' && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B43232" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            fontWeight: 500,
            color: '#1A1A1A',
            marginBottom: 8,
          }}
        >
          {status === 'acquiring_gps' && 'Acquisition GPS...'}
          {status === 'submitting' && 'Vérification...'}
          {status === 'accepted' && `${arrNum}e arrondissement`}
          {status === 'rejected' && 'Entrée refusée'}
        </h3>

        {/* Subtitle / Details */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: '#6B6455',
            marginBottom: 16,
          }}
        >
          {status === 'acquiring_gps' && 'Localisation en cours...'}
          {status === 'submitting' && 'Validation de la position...'}
          {status === 'accepted' && 'Votre présence est enregistrée'}
          {status === 'rejected' && (error ? ERROR_MESSAGES[error.code] || error.message : 'Erreur inconnue')}
        </p>

        {/* GPS Details (for debugging/transparency) */}
        {gpsData.lat !== null && (
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              color: '#8E8982',
              marginBottom: 16,
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.03)',
              borderRadius: 4,
            }}
          >
            {gpsData.lat?.toFixed(6)}, {gpsData.lng?.toFixed(6)}
            <br />
            ±{gpsData.accuracy_m?.toFixed(0)}m
          </div>
        )}

        {/* Error details (if OUTSIDE_ZONE) */}
        {status === 'rejected' && error?.code === 'OUTSIDE_ZONE' && error.details && (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              color: '#B43232',
              marginBottom: 16,
            }}
          >
            {error.details.distance_to_zone_m != null &&
              `Distance: ~${Math.round(error.details.distance_to_zone_m as number)}m`}
          </p>
        )}

        {/* Close button */}
        {(status === 'accepted' || status === 'rejected') && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: status === 'accepted' ? '#007850' : '#B43232',
              background: 'transparent',
              border: `1px solid ${status === 'accepted' ? 'rgba(0,120,80,0.3)' : 'rgba(180,50,50,0.3)'}`,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {status === 'accepted' ? 'Continuer' : 'Fermer'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
