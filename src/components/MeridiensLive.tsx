/**
 * ARCHÉ — Méridiens: observation as practice.
 * Geometric view (meridian line, state), threshold content (arrival + prompts, no quiz), inscription to Carnet.
 * Entry: #meridiens (homepage, Trésor Caché Focus link for saint-sulpice-meridian).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { BackButton } from './BackButton';
import { MamlukGrid } from './MamlukGrid';
import { MeridiensInterface, type LocalMeridianState } from './MeridiensInterface';
import { getThresholds, type Threshold, type ThresholdId } from '../data/meridiens';
import { haversineMeters } from '../utils/geo';
import { useStabilizedPosition } from '../hooks/useStabilizedPosition';
import { useMeridianLock } from '../hooks/useMeridianLock';
import { useAxisDoorTrigger } from '../hooks/useAxisDoorTrigger';
import { RevelationSheet } from './Meridiens/RevelationSheet';
import type { AxisDoor } from '../data/axis-doors';
import {
  distanceToMeridianMeters,
  emaPoint,
  getMeridienState,
  getNearestThreshold,
  inParisBbox,
  isHeadingStable,
  computeMeridienSignalQuality,
  MERIDIAN_LNG,
  MERIDIEN_EMA_ALPHA,
  MERIDIEN_HINT_KEYS,
  MERIDIEN_HEADING_STABLE_MAX_VARIANCE_DEG,
  SAMPLE_BUFFER_MAX,
  MAX_ACCURACY_FOR_SMOOTHING_M,
  MERIDIEN_HEADING_SAMPLES_FOR_STABILITY,
  type MeridienState,
  type PositionSample
} from '../utils/meridien-geo';
import {
  getThresholdsVisited,
  markThresholdVisited,
  markObservation,
  hasObservation,
  getCrossings,
  addCrossing
} from '../utils/meridien-storage';
import { appendMeridienInscription } from '../utils/journal-sync';
import { postMeridianProof } from '../utils/card-gate-map-client';
import { useTranslation } from '../utils/i18n';
import { usePresence } from '../hooks/usePresence';
import { isGradeSufficientForSoftConfirmation, isGradeSufficientForSeal } from '../utils/meridien-presence-gate';
import { api } from '../lib/api';

/** Zone id for presence verify (server meridian zone). No raw zone objects in prod. */
const MERIDIAN_ZONE_ID = 'MERIDIAN_LINE';
/** Cooldown between heuristic-driven verifies (ms). */
const MERIDIAN_VERIFY_COOLDOWN_MS = 30000;
import type { WorldSnapshotData } from '../lib/api';
import {
  MERIDIAN_FETCH_DEADBAND_M,
  MERIDIAN_FETCH_DEADBAND_DEG,
  MERIDIAN_FETCH_MIN_INTERVAL_MS
} from '../design/motion';

interface MeridiensLiveProps {
  onBack: () => void;
  cardId: string | null;
}

type ViewMode = 'geometric' | 'threshold' | 'inscription';

export function MeridiensLive({ onBack, cardId }: MeridiensLiveProps) {
  const { t, language } = useTranslation();
  const {
    state: presenceState,
    grade: presenceGrade,
    readyToVerify,
    verify: presenceVerify,
    whisper: presenceWhisper,
    lastResponse: lastVerifyResponse,
  } = usePresence({ durationMs: 8000, intervalMs: 750 });

  const watchIdRef = useRef<number | null>(null);
  const lastVerifyTsRef = useRef<number>(0);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy_m, setAccuracy_m] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('geometric');
  const [activeThreshold, setActiveThreshold] = useState<Threshold | null>(null);
  const [inscriptionPrompt, setInscriptionPrompt] = useState<string>('');
  const [inscriptionContent, setInscriptionContent] = useState('');
  const [proofAnswer, setProofAnswer] = useState('');
  const [proofPersonalSentence, setProofPersonalSentence] = useState('');
  const [proofSaving, setProofSaving] = useState(false);
  const [inscriptionThresholdId, setInscriptionThresholdId] = useState<ThresholdId | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [expandedThresholdId, setExpandedThresholdId] = useState<ThresholdId | null>(null);
  const [expandedReadId, setExpandedReadId] = useState<ThresholdId | null>(null);
  const [snapshot, setSnapshot] = useState<WorldSnapshotData | null>(null);
  const [lireVerifying, setLireVerifying] = useState(false);
  const [observationVerifying, setObservationVerifying] = useState<string | null>(null);
  const [revelationDoor, setRevelationDoor] = useState<AxisDoor | null>(null);
  const [revelationOpen, setRevelationOpen] = useState(false);
  const [axisId, setAxisId] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1);
    const q = hash.indexOf('?');
    if (q < 0) return null;
    const params = new URLSearchParams(hash.slice(q + 1));
    const id = params.get('axisId');
    return id;
  });
  const lastSmoothedRef = useRef<{ lat: number; lng: number } | null>(null);
  const positionBufferRef = useRef<PositionSample[]>([]);
  const headingsRef = useRef<number[]>([]);
  const lastFetchRef = useRef<{
    lat: number;
    lng: number;
    heading: number | undefined;
    ts: number;
  } | null>(null);

  const thresholds = getThresholds();
  const visited = getThresholdsVisited();
  const crossings = getCrossings();
  const inParis = userPos ? inParisBbox(userPos.lat, userPos.lng) : false;
  const qualityResult = userPos
    ? computeMeridienSignalQuality(
        accuracy_m,
        positionBufferRef.current,
        headingsRef.current,
        inParis
      )
    : { quality: 'low' as const, hintKey: MERIDIEN_HINT_KEYS.signalWeak };
  const signalGood = qualityResult.quality === 'good';
  const useHeadingForAligned =
    signalGood &&
    isHeadingStable(
      headingsRef.current.slice(-MERIDIEN_HEADING_SAMPLES_FOR_STABILITY),
      MERIDIEN_HEADING_STABLE_MAX_VARIANCE_DEG
    );
  const nearest = userPos ? getNearestThreshold(userPos.lat, userPos.lng) : null;
  const state: MeridienState = !userPos || !signalGood
    ? 'lost'
    : getMeridienState(userPos.lat, userPos.lng, heading, {
        useHeadingForAligned
      });
  const allVisited = visited.length >= 3;
  const lineOpacity = Math.min(0.05 + crossings.length * 0.02, 0.15);

  // Halo: center on nearest threshold when near/on/aligned, else map center
  const haloThreshold =
    state !== 'lost' && userPos
      ? nearest ??
        thresholds.slice().sort((a, b) =>
          haversineMeters(userPos.lat, userPos.lng, a.lat, a.lng) -
          haversineMeters(userPos.lat, userPos.lng, b.lat, b.lng)
        )[0]
      : null;
  const haloCenterLeft = haloThreshold ? 50 + (haloThreshold.lng - 2.3372) * 250 : 50;
  const haloCenterTop = haloThreshold ? 50 - (haloThreshold.lat - 48.8566) * 500 : 50;
  const haloOpacity =
    state === 'lost' ? 0 : state === 'near' ? 0.18 : state === 'on_line' ? 0.3 : 0.45;

  // Crossing and visited are gated by Presence: only after verify (Lire / proof).

  // When leaving radius while in threshold view, return to geometric
  useEffect(() => {
    if (viewMode === 'threshold' && !nearest) {
      setViewMode('geometric');
      setActiveThreshold(null);
    }
  }, [viewMode, nearest]);

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.slice(1);
      const q = hash.indexOf('?');
      if (q < 0) {
        setAxisId(null);
        return;
      }
      const params = new URLSearchParams(hash.slice(q + 1));
      setAxisId(params.get('axisId'));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Stabilized GPS: replaces raw watchPosition with shared stabilizer
  const stabilized = useStabilizedPosition({ maxAccuracyM: MAX_ACCURACY_FOR_SMOOTHING_M });
  const lock = useMeridianLock({
    axisId,
    position: stabilized.pos ? { lat: stabilized.pos.lat, lng: stabilized.pos.lng } : null,
    headingDeg: stabilized.pos?.heading ?? null,
    accuracyM: stabilized.pos?.accuracy ?? null,
    speedMps: stabilized.pos?.speed ?? null,
  });
  const axisIdNum = axisId != null ? parseInt(axisId, 10) : null;
  const doorTrigger = useAxisDoorTrigger({
    axisId: Number.isFinite(axisIdNum) ? axisIdNum : null,
    lockState: lock.lockState,
    distToAxisM: lock.distToAxisM,
    headingErrorDeg: lock.headingErrorDeg,
    speedMps: stabilized.pos?.speed ?? null,
    activationMode: lock.activationMode,
  });
  useEffect(() => {
    if (doorTrigger.door && !revelationOpen) {
      setRevelationDoor(doorTrigger.door);
      setRevelationOpen(true);
    }
  }, [doorTrigger.door, revelationOpen]);
  const revelationOpenDoorCalledRef = useRef(false);
  useEffect(() => {
    if (revelationOpen && revelationDoor) {
      if (!revelationOpenDoorCalledRef.current) {
        doorTrigger.openDoor(revelationDoor.key);
        revelationOpenDoorCalledRef.current = true;
      }
    } else {
      revelationOpenDoorCalledRef.current = false;
    }
  }, [revelationOpen, revelationDoor]);
  useEffect(() => {
    if (!stabilized.pos) {
      if (stabilized.status === 'error') {
        setUserPos(null);
        setAccuracy_m(null);
      }
      return;
    }
    const { lat, lng, accuracy, heading: h } = stabilized.pos;
    const ts = Date.now();
    setAccuracy_m(accuracy);

    const buf = positionBufferRef.current;
    buf.push({ lat, lng, ts });
    if (buf.length > SAMPLE_BUFFER_MAX) buf.shift();

    const raw = { lat, lng };
    const smoothed = emaPoint(lastSmoothedRef.current, raw, MERIDIEN_EMA_ALPHA);
    lastSmoothedRef.current = smoothed;
    setUserPos(smoothed);

    if (typeof h === 'number' && Number.isFinite(h)) {
      const ring = headingsRef.current;
      ring.push(h);
      if (ring.length > MERIDIEN_HEADING_SAMPLES_FOR_STABILITY) ring.shift();
      setHeading(h);
    }
  }, [stabilized.pos]);

  // Snapshot fetch with throttle and deadband (Patch 1)
  useEffect(() => {
    if (!userPos) return;
    const now = Date.now();
    const prev = lastFetchRef.current;
    const shouldFetch =
      !prev ||
      haversineMeters(prev.lat, prev.lng, userPos.lat, userPos.lng) > MERIDIAN_FETCH_DEADBAND_M ||
      (heading !== undefined && prev.heading !== undefined &&
        Math.min(
          Math.abs(heading - prev.heading),
          360 - Math.abs(heading - prev.heading)
        ) > MERIDIAN_FETCH_DEADBAND_DEG) ||
      now - prev.ts > MERIDIAN_FETCH_MIN_INTERVAL_MS;

    if (!shouldFetch) return;

    lastFetchRef.current = { lat: userPos.lat, lng: userPos.lng, heading, ts: now };
    const h3 = 'PAR-06';
    api
      .worldSnapshot({ h3_center: h3, k: 0, include: 'map,champ,law' })
      .then((res) => {
        if (res.data) {
          setSnapshot(res.data);
        }
      })
      .catch(() => {
        // Keep last valid snapshot; fallback to local meridian
      });
  }, [userPos?.lat, userPos?.lng, heading]);

  // Meridian state: from snapshot or local fallback. Quality gate: never output wrong reading; when not good, EGARE + hint.
  const LOST_M = 100;
  const hintText = qualityResult.quality !== 'good' ? t(qualityResult.hintKey) : '';

  const fallbackMeridianState = (): LocalMeridianState & { quality: typeof qualityResult.quality; hint?: string } => ({
    state: 'EGARE',
    alignmentIndex: 0,
    holdProgress01: 0,
    recognized: thresholds.map((t) => ({
      placeId: t.id,
      status: 'NON_RECONNU' as const
    })),
    nearestPlaceId: null,
    micro: { statusLine: hintText },
    quality: qualityResult.quality,
    hint: hintText || undefined
  });

  const meridian: (LocalMeridianState & { quality?: typeof qualityResult.quality; hint?: string }) = (() => {
    if (axisId && lock.axisName != null) {
      const dist = lock.distToAxisM ?? 9999;
      const localStateKey: LocalMeridianState['state'] =
        lock.lockState === 'RESONANCE'
          ? 'ALIGNE'
          : lock.lockState === 'INTERFERENCE'
            ? 'SUR_LIGNE'
            : dist < 350
              ? 'PROCHE'
              : 'EGARE';
      return {
        state: localStateKey,
        alignmentIndex: lock.alignmentScore,
        holdProgress01: lock.lockState === 'RESONANCE' ? 1 : 0,
        recognized: thresholds.map((t) => ({
          placeId: t.id,
          status: 'NON_RECONNU' as const
        })),
        nearestPlaceId: null,
        micro: { statusLine: '' },
        quality: 'good',
        hint: undefined
      };
    }
    if (!userPos) return fallbackMeridianState();
    if (!signalGood) return fallbackMeridianState();
    const lineDistanceM = distanceToMeridianMeters(userPos.lng);
    const localState = getMeridienState(userPos.lat, userPos.lng, heading, {
      useHeadingForAligned
    });
    const localStateKey: LocalMeridianState['state'] =
      localState === 'lost'
        ? 'EGARE'
        : localState === 'near'
          ? 'PROCHE'
          : localState === 'on_line'
            ? 'SUR_LIGNE'
            : 'ALIGNE';
    const alignmentIndex = Math.max(0, Math.min(1, 1 - lineDistanceM / LOST_M));
    const visitedIds = getThresholdsVisited();
    const nearestThresh = getNearestThreshold(userPos.lat, userPos.lng);
    const recognized = thresholds.map((t) => ({
      placeId: t.id,
      status: (visitedIds.includes(t.id) || (nearestThresh?.id === t.id) ? 'RECONNU' : 'NON_RECONNU') as 'RECONNU' | 'NON_RECONNU'
    }));
    return {
      state: localStateKey,
      alignmentIndex,
      holdProgress01: localStateKey === 'ALIGNE' ? 1 : 0,
      recognized,
      nearestPlaceId: nearestThresh?.id ?? null,
      micro: { statusLine: '' },
      quality: 'good',
      hint: undefined
    };
  })();

  const isAlignedWithLatitude = (t: Threshold) => {
    if (!userPos) return false;
    const distToLine = distanceToMeridianMeters(userPos.lng);
    if (distToLine > 30) return false;
    const latDiff = Math.abs(userPos.lat - t.lat);
    return latDiff * 111000 < 80; // ~80m latitude tolerance
  };

  const openInscription = (threshold: Threshold) => {
    const prompt =
      language === 'fr' ? threshold.inscriptionPromptFR : threshold.inscriptionPromptEN;
    setInscriptionPrompt(prompt);
    setInscriptionContent('');
    setProofAnswer('');
    setProofPersonalSentence('');
    setInscriptionThresholdId(threshold.id);
    setViewMode('inscription');
    setSavedFeedback(false);
  };

  const saveInscription = async () => {
    if (!cardId || !inscriptionThresholdId || !inscriptionContent.trim()) return;
    await appendMeridienInscription(cardId, inscriptionThresholdId, inscriptionContent.trim());
    setSavedFeedback(true);
    setTimeout(() => {
      setViewMode('threshold');
      setActiveThreshold(thresholds.find((t) => t.id === inscriptionThresholdId) ?? null);
      setInscriptionThresholdId(null);
    }, 1200);
  };

  const backToGeometric = () => {
    setViewMode('geometric');
    setActiveThreshold(null);
  };

  /** Presence-gated: open threshold (Lire) only after verify with grade >= MED. */
  const handleLireClick = useCallback(async () => {
    if (!nearest || lireVerifying || !readyToVerify) return;
    setLireVerifying(true);
    try {
      const res = await presenceVerify(MERIDIAN_ZONE_ID);
      lastVerifyTsRef.current = Date.now();
      const grade = res?.grade ?? presenceGrade;
      if (isGradeSufficientForSoftConfirmation(grade)) {
        markThresholdVisited(nearest.id);
        const after = getThresholdsVisited();
        if (after.length >= 3 && getCrossings().length === 0 && isGradeSufficientForSeal(grade)) {
          addCrossing();
        }
        setActiveThreshold(nearest);
        setViewMode('threshold');
      }
    } finally {
      setLireVerifying(false);
    }
  }, [nearest, readyToVerify, presenceVerify, presenceGrade, lireVerifying]);

  /** Presence-gated: record observation only after verify with grade >= MED. */
  const handleMarkObservation = useCallback(
    async (thresholdId: ThresholdId, promptId: string) => {
      if (observationVerifying !== null) return;
      setObservationVerifying(promptId);
      try {
        const res = await presenceVerify(MERIDIAN_ZONE_ID);
        const grade = res?.grade ?? presenceGrade;
        if (isGradeSufficientForSoftConfirmation(grade)) {
          markObservation(thresholdId, promptId);
        }
      } finally {
        setObservationVerifying(null);
      }
    },
    [presenceVerify, presenceGrade, observationVerifying]
  );

  /** Presence-gated: save proof only after verify with grade === HIGH. */
  const handleSaveMeridianProof = useCallback(async () => {
    if (!cardId || !inscriptionThresholdId || !proofAnswer.trim() || !proofPersonalSentence.trim()) return;
    const res = await presenceVerify(MERIDIAN_ZONE_ID);
    const grade = res?.grade ?? presenceGrade;
    if (!isGradeSufficientForSeal(grade)) {
      return; // whisper already set by usePresence
    }
    const threshold = getThresholdById(inscriptionThresholdId);
    const lat = userPos?.lat ?? threshold?.lat ?? 48.8566;
    const lng = userPos?.lng ?? threshold?.lng ?? 2.3522;
    const radius_m = Math.min(Math.max(80, (userPos ? 120 : 200)), 200);
    setProofSaving(true);
    try {
      await postMeridianProof(cardId, {
        meridian_id: inscriptionThresholdId,
        approx: { lat, lng, radius_m },
        answer: proofAnswer.trim(),
        personal_sentence: proofPersonalSentence.trim()
      });
      emitEngraveEvent('proof_meridien');
      setSavedFeedback(true);
      setTimeout(() => {
        setViewMode('threshold');
        setActiveThreshold(thresholds.find((t) => t.id === inscriptionThresholdId) ?? null);
        setInscriptionThresholdId(null);
      }, 1200);
    } finally {
      setProofSaving(false);
    }
  }, [
    cardId,
    inscriptionThresholdId,
    proofAnswer,
    proofPersonalSentence,
    userPos,
    presenceVerify,
    presenceGrade,
    thresholds,
  ]);

  // —— Inscription view ——
  if (viewMode === 'inscription') {
    return (
      <div
        className="min-h-screen relative flex flex-col"
        style={{ background: '#FAF8F2', overflow: 'hidden' }}
      >
        <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />
        <BackButton onClick={() => setViewMode('threshold')} />
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            padding: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(80px, 10vh, 100px)',
            position: 'relative',
            zIndex: 10
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: 8
            }}
          >
            {inscriptionThresholdId &&
              (language === 'fr'
                ? getThresholdById(inscriptionThresholdId)?.subtitleFR
                : getThresholdById(inscriptionThresholdId)?.subtitleEN)}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              color: '#1A1A1A',
              opacity: 0.9,
              marginBottom: 24,
              lineHeight: 1.5
            }}
          >
            {inscriptionPrompt}
          </p>
          <label style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#003D2C', opacity: 0.6, marginBottom: 6, display: 'block' }}>
            {t('meridiens.proof.answer')}
          </label>
          <input
            type="text"
            value={proofAnswer}
            onChange={(e) => setProofAnswer(e.target.value)}
            placeholder=""
            style={{
              width: '100%',
              padding: 14,
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              color: '#1A1A1A',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(0,61,44,0.2)',
              borderRadius: 0,
              marginBottom: 16,
              boxSizing: 'border-box'
            }}
          />
          <label style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#003D2C', opacity: 0.6, marginBottom: 6, display: 'block' }}>
            {t('meridiens.proof.personalSentence')}
          </label>
          <textarea
            value={proofPersonalSentence}
            onChange={(e) => setProofPersonalSentence(e.target.value)}
            placeholder={t('meridiens.inscribe.placeholder')}
            rows={4}
            style={{
              width: '100%',
              padding: 16,
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              color: '#1A1A1A',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(0,61,44,0.2)',
              borderRadius: 0,
              resize: 'vertical',
              marginBottom: 24,
              boxSizing: 'border-box'
            }}
          />
          {savedFeedback ? (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#003D2C', opacity: 0.8 }}>
              {t('meridiens.proof.saved')}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleSaveMeridianProof}
              disabled={!proofAnswer.trim() || !proofPersonalSentence.trim() || proofSaving || !cardId}
              style={{
                padding: '12px 24px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#003D2C',
                background: proofAnswer.trim() && proofPersonalSentence.trim() ? 'rgba(0,61,44,0.08)' : 'transparent',
                border: '1px solid rgba(0,61,44,0.3)',
                cursor: proofAnswer.trim() && proofPersonalSentence.trim() && !proofSaving ? 'pointer' : 'default',
                opacity: proofAnswer.trim() && proofPersonalSentence.trim() ? 1 : 0.5
              }}
            >
              {proofSaving ? '…' : t('meridiens.proof.confirmProximity')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // —— Threshold view (within radius) ——
  if (viewMode === 'threshold' && activeThreshold) {
    const isFR = language === 'fr';
    const arrival = isFR ? activeThreshold.arrivalContentFR : activeThreshold.arrivalContentEN;
    const title = isFR ? activeThreshold.titleFR : activeThreshold.titleEN;
    const subtitle = isFR ? activeThreshold.subtitleFR : activeThreshold.subtitleEN;

    return (
      <div
        className="min-h-screen relative flex flex-col overflow-auto"
        style={{ background: '#FAF8F2' }}
      >
        <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />
        <BackButton onClick={backToGeometric} />
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            padding: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(80px, 10vh, 100px)',
            position: 'relative',
            zIndex: 10,
            paddingBottom: 80
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.5,
              marginBottom: 4
            }}
          >
            {subtitle}
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(22px, 4vw, 28px)',
              color: '#003D2C',
              marginBottom: 24,
              lineHeight: 1.2
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              color: '#1A1A1A',
              opacity: 0.9,
              lineHeight: 1.6,
              marginBottom: 32,
              whiteSpace: 'pre-wrap'
            }}
          >
            {arrival}
          </p>
          <hr
            style={{
              border: 'none',
              borderTop: '1px solid rgba(0,61,44,0.15)',
              marginBottom: 24
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: 16
            }}
          >
            {t('meridiens.observe')}
          </p>
          {activeThreshold.prompts.map((prompt) => {
            const seen = hasObservation(activeThreshold.id, prompt.id);
            const text = isFR ? prompt.textFR : prompt.textEN;
            return (
              <div
                key={prompt.id}
                style={{
                  marginBottom: 20,
                  padding: 12,
                  background: seen ? 'rgba(0,61,44,0.04)' : 'transparent',
                  borderLeft: seen ? '3px solid rgba(0,61,44,0.3)' : 'none'
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    color: '#1A1A1A',
                    opacity: 0.9,
                    marginBottom: 8,
                    lineHeight: 1.5
                  }}
                >
                  {text}
                </p>
                {!seen ? (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleMarkObservation(activeThreshold.id, prompt.id)}
                      disabled={observationVerifying === prompt.id}
                      style={{
                        padding: '6px 14px',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        letterSpacing: '0.05em',
                        color: '#003D2C',
                        background: 'transparent',
                        border: '1px solid rgba(0,61,44,0.4)',
                        cursor: 'pointer'
                      }}
                    >
                      {t('meridiens.prompt.found')}
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '6px 14px',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        color: '#6B6455',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: 0.8
                      }}
                    >
                      {t('meridiens.prompt.later')}
                    </button>
                  </div>
                ) : (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#003D2C', opacity: 0.6 }}>
                    {t('meridiens.prompt.seen')}
                  </p>
                )}
              </div>
            );
          })}
          <hr
            style={{
              border: 'none',
              borderTop: '1px solid rgba(0,61,44,0.15)',
              margin: '24px 0'
            }}
          />
          <button
            type="button"
            onClick={() => openInscription(activeThreshold)}
            style={{
              padding: '12px 24px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#003D2C',
              background: 'transparent',
              border: '1px solid rgba(0,61,44,0.4)',
              cursor: 'pointer'
            }}
          >
            {t('meridiens.inscribe.button')}
          </button>
        </div>
      </div>
    );
  }

  // —— Geometric view (default): instrument + optional Lire doorway (Patch 6)
  const recognizedPlaceInRadius =
    nearest &&
    meridian.recognized.some((r) => r.placeId === nearest.id && r.status === 'RECONNU');

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {axisId && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: '#003D2C',
            opacity: 0.7,
          }}
        >
          {lock.axisName
            ? t('meridiens.guidance.lockedOn', { name: lock.axisName })
            : t('meridiens.guidance.searching')}
        </div>
      )}
      <MeridiensInterface
        meridian={meridian}
        onExit={onBack}
        speedFactor={axisId ? lock.speedFactor : 1}
        arrivalTightness={axisId ? lock.arrivalTightness : 0}
      />
      {import.meta.env.DEV && import.meta.env.VITE_DEBUG_TERRITORY && axisId && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: 8,
            right: 8,
            padding: 8,
            background: 'rgba(0,0,0,0.75)',
            color: '#eee',
            fontFamily: 'monospace',
            fontSize: 10,
            zIndex: 100,
            borderRadius: 4,
          }}
        >
          distToAxisM: {lock.distToAxisM?.toFixed(0) ?? '—'} · headingErrorDeg: {lock.headingErrorDeg?.toFixed(1) ?? '—'} · accuracyM: {stabilized.pos?.accuracy?.toFixed(0) ?? '—'} · speedMps: {(stabilized.pos?.speed ?? 0).toFixed(2)} · {lock.lockState} · {lock.activationMode ?? '—'} · axisId: {axisId}
        </div>
      )}
      {recognizedPlaceInRadius && nearest && !axisId && (
        <div
          style={{
            position: 'fixed',
            bottom: 'max(24px, env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
          }}
        >
          <button
            type="button"
            onClick={handleLireClick}
            disabled={lireVerifying || !readyToVerify}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#003D2C',
              background: 'transparent',
              border: 'none',
              cursor: lireVerifying || !readyToVerify ? 'default' : 'pointer',
              opacity: lireVerifying || !readyToVerify ? 0.5 : 0.7,
              textDecoration: 'underline',
              padding: 8,
            }}
          >
            {lireVerifying ? '…' : t('meridiens.instrument.read')}
          </button>
        </div>
      )}
      {revelationDoor && (
        <RevelationSheet
          isOpen={revelationOpen}
          onClose={() => {
            setRevelationOpen(false);
            setRevelationDoor(null);
          }}
          door={revelationDoor}
        />
      )}
    </div>
  );
}

function getThresholdById(id: ThresholdId): Threshold | undefined {
  return getThresholds().find((t) => t.id === id);
}
