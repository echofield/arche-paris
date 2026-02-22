/**
 * ARCHÉ — usePresence: single source of truth for "I am here"
 * Runs verification burst, computes trust, sends claim to backend, exposes state/grade/whisper.
 */
import { useState, useCallback } from 'react';
import {
  getVerificationBurst,
  type PresenceGrade,
  type PresenceState,
  type PresenceVerifyResponse,
} from '@/lib/presence';
import { presenceVerify } from '@/lib/presence/api';

export interface UsePresenceOptions {
  /** Duration of GPS burst in ms */
  durationMs?: number;
  /** Interval between samples in ms */
  intervalMs?: number;
}

export interface UsePresenceResult {
  state: PresenceState;
  grade: PresenceGrade | null;
  inside: boolean | undefined;
  whisper: string | null;
  lastResponse: PresenceVerifyResponse | null;
  error: string | null;
  /** Run verification; optionally pass zone for server-side gating */
  verify: (zone?: { lat: number; lng: number; radiusM: number } | string) => Promise<PresenceVerifyResponse | null>;
}

export function usePresence(opts: UsePresenceOptions = {}): UsePresenceResult {
  const [state, setState] = useState<PresenceState>('IDLE');
  const [grade, setGrade] = useState<PresenceGrade | null>(null);
  const [inside, setInside] = useState<boolean | undefined>(undefined);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<PresenceVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (
      zone?: { lat: number; lng: number; radiusM: number } | string
    ): Promise<PresenceVerifyResponse | null> => {
      setState('SEARCHING');
      setError(null);
      setWhisper(null);

      try {
        const { proof, samples } = await getVerificationBurst({
          durationMs: opts.durationMs ?? 8000,
          intervalMs: opts.intervalMs ?? 750,
        });

        if (samples.length === 0) {
          setState('IDLE');
          setGrade('LOW');
          setWhisper('Signal trop faible — approche-toi de l\'air libre.');
          setLastResponse({
            ok: false,
            grade: 'LOW',
            reasonCode: 'LOW_TRUST',
            whisper: 'Signal trop faible — approche-toi de l\'air libre.',
            serverTs: Date.now(),
          });
          return null;
        }

        const zonePayload =
          typeof zone === 'string'
            ? { zoneId: zone }
            : zone
              ? { zone: { lat: zone.lat, lng: zone.lng, radiusM: zone.radiusM } }
              : undefined;

        const { data, error: apiError } = await presenceVerify({
          mode: 'burst',
          samples,
          ...zonePayload,
          client:
            typeof navigator !== 'undefined'
              ? { ua: navigator.userAgent?.slice(0, 200), platform: navigator.platform }
              : undefined,
        });

        if (apiError || !data) {
          setError(apiError ?? 'Verification failed');
          setState('IDLE');
          setGrade(proof.grade);
          setWhisper(data?.whisper ?? 'Signal trop faible — approche-toi de l\'air libre.');
          setLastResponse(
            data ?? {
              ok: false,
              grade: proof.grade,
              reasonCode: 'LOW_TRUST',
              whisper: 'Signal trop faible — approche-toi de l\'air libre.',
              serverTs: Date.now(),
            }
          );
          return data ?? null;
        }

        setLastResponse(data);
        setGrade(data.grade);
        setInside(data.inside);
        setWhisper(data.whisper ?? null);

        if (data.ok && data.grade === 'HIGH') {
          setState('ANCHORED');
        } else if (data.grade === 'MED') {
          setState('UNSTABLE');
        } else {
          setState('IDLE');
        }

        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Verification failed';
        setError(msg);
        setState('IDLE');
        setWhisper('Signal trop faible — approche-toi de l\'air libre.');
        return null;
      }
    },
    [opts.durationMs, opts.intervalMs]
  );

  return {
    state,
    grade,
    inside,
    whisper,
    lastResponse,
    error,
    verify,
  };
}
