/**
 * ARCHÉ — usePresence: single source of truth for "I am here"
 * Warmup before verify; anchor continuity; interference detection.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getVerificationBurst,
  getPassiveFix,
  type PresenceGrade,
  type PresenceState,
  type PresenceVerifyResponse,
  type LocationSample,
} from '@/lib/presence';
import { readAnchor, writeAnchor } from '@/lib/presence/anchor';
import { presenceVerify } from '@/lib/presence/api';

const MIN_READY_SAMPLES = 4;
const WARMUP_INTERVAL_MS = 1200;
const WARMUP_MAX_MS = 6000;
const LAST_SAMPLE_MAX_AGE_MS = 3000;
const LOW_WINDOW_MS = 60_000;

export interface UsePresenceOptions {
  durationMs?: number;
  intervalMs?: number;
}

export interface UsePresenceResult {
  state: PresenceState;
  grade: PresenceGrade | null;
  inside: boolean | undefined;
  whisper: string | null;
  lastResponse: PresenceVerifyResponse | null;
  error: string | null;
  readyToVerify: boolean;
  interference: boolean;
  /** Pass zoneId (string) for server inside check. Object zone only supported when DEBUG_PRESENCE (server); in prod object is stripped → trust-only, no inside check. */
  verify: (zone?: { lat: number; lng: number; radiusM: number } | string) => Promise<PresenceVerifyResponse | null>;
}

export function usePresence(opts: UsePresenceOptions = {}): UsePresenceResult {
  const [state, setState] = useState<PresenceState>('WARMING');
  const [grade, setGrade] = useState<PresenceGrade | null>(null);
  const [inside, setInside] = useState<boolean | undefined>(undefined);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<PresenceVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warmupSamples, setWarmupSamples] = useState<LocationSample[]>([]);
  const [interference, setInterference] = useState(false);
  const lowCountRef = useRef(0);
  const lowWindowStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState('IDLE');
      return;
    }
    const start = Date.now();
    const buffer: LocationSample[] = [];

    const tick = async () => {
      const s = await getPassiveFix();
      if (s) {
        buffer.push(s);
        setWarmupSamples(buffer.slice(-10).filter((x) => Date.now() - x.ts <= 10_000));
      }
      if (Date.now() - start >= WARMUP_MAX_MS || buffer.length >= MIN_READY_SAMPLES) {
        return;
      }
      setTimeout(tick, WARMUP_INTERVAL_MS);
    };
    tick();
  }, []);

  useEffect(() => {
    if (state !== 'WARMING') return;
    const last = warmupSamples.length > 0 ? warmupSamples[warmupSamples.length - 1] : null;
    const ready =
      warmupSamples.length >= MIN_READY_SAMPLES &&
      last !== null &&
      Date.now() - last.ts < LAST_SAMPLE_MAX_AGE_MS;
    if (ready) setState('IDLE');
  }, [state, warmupSamples]);

  const readyToVerify =
    warmupSamples.length >= MIN_READY_SAMPLES &&
    warmupSamples.length > 0 &&
    Date.now() - warmupSamples[warmupSamples.length - 1].ts < LAST_SAMPLE_MAX_AGE_MS;

  useEffect(() => {
    const r = lastResponse;
    if (!r) return;
    const isLow = r.grade === 'LOW' || r.reasonCode === 'LOW_TRUST';
    const now = Date.now();
    if (isLow) {
      if (lowWindowStartRef.current === null) lowWindowStartRef.current = now;
      if (now - lowWindowStartRef.current <= LOW_WINDOW_MS) {
        lowCountRef.current += 1;
        if (lowCountRef.current >= 2) setInterference(true);
      } else {
        lowWindowStartRef.current = now;
        lowCountRef.current = 1;
      }
    } else {
      lowWindowStartRef.current = null;
      lowCountRef.current = 0;
      setInterference(false);
    }
  }, [lastResponse]);

  const verify = useCallback(
    async (
      zone?: { lat: number; lng: number; radiusM: number } | string
    ): Promise<PresenceVerifyResponse | null> => {
      setState('SEARCHING');
      setError(null);
      setWhisper(null);

      const anchor = readAnchor();

      try {
        const { proof, samples } = await getVerificationBurst({
          durationMs: opts.durationMs ?? 8000,
          intervalMs: opts.intervalMs ?? 750,
          anchor: anchor ?? undefined,
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

        // Object zone only supported in DEBUG_PRESENCE (server); in prod we send nothing → trust-only, no inside check
        // Object zone only supported in DEBUG_PRESENCE (server); in prod we send nothing → trust-only, no inside check
        const zonePayload =
          typeof zone === 'string'
            ? { zoneId: zone }
            : import.meta.env.PROD
              ? undefined
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

        if (data.ok && (data.grade === 'HIGH' || data.inside === true) && proof.best) {
          writeAnchor({
            lat: proof.best.lat,
            lng: proof.best.lng,
            ts: Date.now(),
            grade: 'HIGH',
          });
        }

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
    readyToVerify,
    interference,
    verify,
  };
}
