/**
 * RitualRunner — Core ritual execution flow
 *
 * One screen. One timer. One complete call.
 * State: idle → acquiring_gps → starting → running → completing → success|rejected
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, generateIdempotencyKey, clientTs } from '../lib/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTranslation } from '../utils/i18n';

export type RitualType = 'presence' | 'observation';

export type RitualState =
  | 'idle'
  | 'acquiring_gps'
  | 'starting'
  | 'running'
  | 'completing'
  | 'success'
  | 'rejected';

interface RitualRunnerProps {
  zoneId: string;
  ritualType: RitualType;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
}

const RITUAL_CONFIG = {
  presence: {
    label: 'Présence',
    durationMs: 20000,
    instruction: 'Reste immobile. Respire.',
    maxAccuracyM: 35,
  },
  observation: {
    label: 'Observation',
    durationMs: 15000,
    instruction: 'Observe. Écoute. Ressens.',
    maxAccuracyM: 35,
  },
} as const;

// Haptic feedback helper
function haptic(type: 'light' | 'medium' | 'success' | 'error') {
  if ('vibrate' in navigator) {
    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 25,
      success: [50, 30, 50],
      error: [100, 50, 100],
    };
    navigator.vibrate(patterns[type]);
  }
}

export function RitualRunner({ zoneId, ritualType, onComplete, onCancel }: RitualRunnerProps) {
  const { t } = useTranslation();
  const config = RITUAL_CONFIG[ritualType];
  const geo = useGeolocation();

  const [state, setState] = useState<RitualState>('idle');
  const [runId, setRunId] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Start the ritual
  const startRitual = useCallback(async () => {
    setState('acquiring_gps');
    setError(null);

    // 1. Get GPS
    const position = await geo.refresh();
    if (!position) {
      setState('rejected');
      setError({ code: 'GPS_FAILED', message: geo.error || 'Impossible d\'obtenir la position GPS' });
      haptic('error');
      return;
    }

    // Check accuracy before even starting (code unchanged; message is user-facing only)
    if (position.coords.accuracy > config.maxAccuracyM) {
      setState('rejected');
      setError({
        code: 'ACCURACY_TOO_LOW',
        message: t('presence.signalWeak'),
      });
      haptic('error');
      return;
    }

    setState('starting');

    // 2. Call rituals-start
    const result = await api.ritualsStart({
      zone_id: zoneId,
      ritual_type: ritualType,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy_m: position.coords.accuracy,
      client_ts: clientTs(),
      idempotency_key: generateIdempotencyKey(`ritual-${ritualType}-${zoneId}`),
    });

    if (result.error || !result.data) {
      setState('rejected');
      setError({ code: 'START_FAILED', message: result.error || 'Impossible de démarrer le moment' });
      haptic('error');
      return;
    }

    // 3. Start running
    setRunId(result.data.run_id);
    setState('running');
    startTimeRef.current = Date.now();
    haptic('light');

    // Start timer
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);

      // Auto-complete when duration reached
      if (elapsed >= config.durationMs) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        haptic('medium');
      }
    }, 100);
  }, [zoneId, ritualType, config, geo, t]);

  // Complete the ritual
  const completeRitual = useCallback(async () => {
    if (!runId) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState('completing');

    // Get fresh GPS for completion
    const position = await geo.refresh();
    if (!position) {
      setState('rejected');
      setError({ code: 'GPS_FAILED', message: 'GPS perdu pendant le moment' });
      haptic('error');
      return;
    }

    const dwellMs = Date.now() - startTimeRef.current;

    const result = await api.ritualsComplete({
      run_id: runId,
      zone_id: zoneId,
      dwell_ms: dwellMs,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy_m: position.coords.accuracy,
      client_ts: clientTs(),
      idempotency_key: generateIdempotencyKey(`ritual-complete-${runId}`),
    });

    if (result.error || !result.data) {
      setState('rejected');
      // Parse structured error
      let errorMsg = result.error || 'Échec de la complétion';
      let errorCode = 'COMPLETE_FAILED';
      try {
        const parsed = JSON.parse(result.error || '{}');
        if (parsed.code) {
          errorCode = parsed.code;
          errorMsg = parsed.message || errorMsg;
        }
      } catch {
        // Not JSON
      }
      setError({ code: errorCode, message: errorMsg });
      haptic('error');
      return;
    }

    setState('success');
    haptic('success');
  }, [runId, zoneId, geo]);

  // Abort the ritual
  const abortRitual = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (runId) {
      // Fire and forget abort
      api.ritualsAbort({
        run_id: runId,
        zone_id: zoneId,
        reason: 'user_cancelled',
        client_ts: clientTs(),
        idempotency_key: generateIdempotencyKey(`ritual-abort-${runId}`),
      }).catch(() => {});
    }

    onCancel();
  }, [runId, zoneId, onCancel]);

  // Auto-start on mount
  useEffect(() => {
    startRitual();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Calculate progress
  const progressPct = Math.min(100, (elapsedMs / config.durationMs) * 100);
  const remainingMs = Math.max(0, config.durationMs - elapsedMs);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const canComplete = elapsedMs >= config.durationMs;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10005,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      {/* Ritual ring */}
      <div
        style={{
          position: 'relative',
          width: 200,
          height: 200,
          marginBottom: 32,
        }}
      >
        {/* Background ring */}
        <svg
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotate(-90deg)',
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          {state === 'running' && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={canComplete ? '#007850' : '#FAF8F2'}
              strokeWidth="4"
              strokeDasharray={`${progressPct * 2.83} 283`}
              style={{ transition: 'stroke-dasharray 0.1s ease' }}
            />
          )}
        </svg>

        {/* Center content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {(state === 'idle' || state === 'acquiring_gps' || state === 'starting') && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: '#FAF8F2',
                opacity: 0.7,
                textAlign: 'center',
              }}
            >
              {state === 'acquiring_gps' && 'GPS...'}
              {state === 'starting' && 'Démarrage...'}
            </div>
          )}

          {state === 'running' && (
            <>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 48,
                  fontWeight: 300,
                  color: canComplete ? '#007850' : '#FAF8F2',
                }}
              >
                {remainingSec}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  color: '#FAF8F2',
                  opacity: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                }}
              >
                {canComplete ? 'Prêt' : 'secondes'}
              </div>
            </>
          )}

          {state === 'completing' && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: '#FAF8F2',
                opacity: 0.7,
              }}
            >
              Validation...
            </div>
          )}

          {state === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 14,
                  color: '#007850',
                }}
              >
                {config.label} scellée
              </div>
            </div>
          )}

          {state === 'rejected' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8, color: '#B43232' }}>✕</div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: '#B43232',
                  maxWidth: 140,
                }}
              >
                {error?.message || 'Échec'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title and instruction */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            color: '#FAF8F2',
            marginBottom: 8,
          }}
        >
          {config.label}
        </h2>
        {state === 'running' && (
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            {config.instruction}
          </p>
        )}
      </div>

      {/* GPS status — no coords/accuracy in production */}
      {(state === 'running' || state === 'completing') && geo.lat !== null && (
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          {import.meta.env.DEV && import.meta.env.VITE_DEBUG_TERRITORY
            ? `${geo.lat?.toFixed(5)}, ${geo.lng?.toFixed(5)} ±${geo.accuracy_m?.toFixed(0) ?? '?'}m`
            : t('presence.signalSettling')}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 16 }}>
        {state === 'running' && (
          <>
            <button
              type="button"
              onClick={completeRitual}
              disabled={!canComplete}
              style={{
                padding: '14px 32px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: canComplete ? '#FAF8F2' : 'rgba(255,255,255,0.3)',
                background: canComplete ? '#007850' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 4,
                cursor: canComplete ? 'pointer' : 'not-allowed',
              }}
            >
              Terminer
            </button>
            <button
              type="button"
              onClick={abortRitual}
              style={{
                padding: '14px 24px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </>
        )}

        {(state === 'success' || state === 'rejected') && (
          <button
            type="button"
            onClick={() => onComplete(state === 'success')}
            style={{
              padding: '14px 32px',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: state === 'success' ? '#007850' : '#B43232',
              background: 'transparent',
              border: `1px solid ${state === 'success' ? '#007850' : '#B43232'}`,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {state === 'success' ? 'Continuer' : 'Fermer'}
          </button>
        )}

        {(state === 'acquiring_gps' || state === 'starting' || state === 'completing') && (
          <button
            type="button"
            onClick={abortRitual}
            style={{
              padding: '14px 24px',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
