/**
 * ARCHÉ — Méridiens: observation as practice.
 * Geometric view (meridian line, state), threshold content (arrival + prompts, no quiz), inscription to Carnet.
 * Entry: #meridiens (homepage, Trésor Caché Focus link for saint-sulpice-meridian).
 */

import { useState, useEffect, useRef } from 'react';
import { BackButton } from './BackButton';
import { MamlukGrid } from './MamlukGrid';
import { getThresholds, type Threshold, type ThresholdId } from '../data/meridiens';
import { haversineMeters } from '../utils/geo';
import {
  distanceToMeridianMeters,
  getMeridienState,
  getNearestThreshold,
  type MeridienState
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

interface MeridiensLiveProps {
  onBack: () => void;
  cardId: string | null;
}

type ViewMode = 'geometric' | 'threshold' | 'inscription';

export function MeridiensLive({ onBack, cardId }: MeridiensLiveProps) {
  const { t, language } = useTranslation();
  const watchIdRef = useRef<number | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
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

  const thresholds = getThresholds();
  const visited = getThresholdsVisited();
  const crossings = getCrossings();
  const nearest = userPos ? getNearestThreshold(userPos.lat, userPos.lng) : null;
  const state: MeridienState = userPos
    ? getMeridienState(userPos.lat, userPos.lng, heading)
    : 'lost';
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

  // On first time all three visited, record crossing
  useEffect(() => {
    if (visited.length >= 3 && crossings.length === 0) addCrossing();
  }, [visited.length, crossings.length]);

  // When within radius, switch to threshold view and mark visited
  useEffect(() => {
    if (nearest) {
      markThresholdVisited(nearest.id);
      setActiveThreshold(nearest);
      setViewMode('threshold');
    } else if (viewMode === 'threshold' && !nearest) {
      setViewMode('geometric');
      setActiveThreshold(null);
    }
  }, [nearest?.id]);

  // Geolocation
  useEffect(() => {
    const onPos = (pos: GeolocationPosition) => {
      setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      if (pos.coords.heading != null && !isNaN(pos.coords.heading))
        setHeading(pos.coords.heading);
    };
    const onErr = () => setUserPos(null);
    navigator.geolocation.getCurrentPosition(onPos, onErr, { enableHighAccuracy: true });
    const id = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 5000
    });
    watchIdRef.current = id;
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setUserPos(null);
    };
  }, []);

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

  const saveMeridianProof = async () => {
    if (!cardId || !inscriptionThresholdId || !proofAnswer.trim() || !proofPersonalSentence.trim()) return;
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
  };

  const backToGeometric = () => {
    setViewMode('geometric');
    setActiveThreshold(null);
  };

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
              onClick={saveMeridianProof}
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
                      onClick={() => markObservation(activeThreshold.id, prompt.id)}
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

  // —— Geometric view (default) or crossed ——
  const showCrossed = allVisited && crossings.length > 0;
  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center"
      style={{ background: '#FAF8F2', overflow: 'hidden' }}
    >
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />
      <BackButton onClick={onBack} />

      <div
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(80px, 10vh, 100px)',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.6,
            marginBottom: 16
          }}
        >
          {t('meridiens.title')}
        </p>

        {/* Paris outline + meridian line */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(280px, 50vw, 400px)',
            height: 'clamp(200px, 35vw, 300px)',
            marginBottom: 24
          }}
        >
          <img
            src="/Parissvg.svg"
            alt="Paris"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0.2
            }}
          />
          {/* Meridian line (vertical) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 2,
              marginLeft: -1,
              background: 'rgba(0,61,44,0.35)',
              opacity: lineOpacity
            }}
          />
          {/* Proximity halo (field activation; no exact position) */}
          <style>{`
            @keyframes meridiens-halo-pulse {
              0%, 100% { transform: translate(-50%, -50%) scale(1); }
              50% { transform: translate(-50%, -50%) scale(1.03); }
            }
            .meridiens-halo-pulse { animation: meridiens-halo-pulse 4s ease-in-out infinite; }
          `}</style>
          <div
            className={state === 'aligned' ? 'meridiens-halo-pulse' : undefined}
            style={{
              position: 'absolute',
              left: `${haloCenterLeft}%`,
              top: `${haloCenterTop}%`,
              width: '55%',
              height: '55%',
              marginLeft: '-27.5%',
              marginTop: '-27.5%',
              borderRadius: '9999px',
              background: 'radial-gradient(circle, rgba(0,61,44,0.25) 0%, rgba(0,61,44,0.08) 50%, transparent 70%)',
              filter: 'blur(12px)',
              opacity: haloOpacity,
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)'
            }}
          />
          {/* Threshold dots (fixed anchors; no user position dot) */}
          {thresholds.map((t) => (
            <div
              key={t.id}
              style={{
                position: 'absolute',
                left: `${50 + (t.lng - 2.3372) * 250}%`,
                top: `${50 - (t.lat - 48.8566) * 500}%`,
                width: 8,
                height: 8,
                marginLeft: -4,
                marginTop: -4,
                borderRadius: '50%',
                background: 'rgba(0,61,44,0.5)',
                pointerEvents: 'none'
              }}
            />
          ))}
        </div>

        {showCrossed ? (
          <>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(20px, 3.5vw, 26px)',
                fontStyle: 'italic',
                color: '#003D2C',
                marginBottom: 8
              }}
            >
              {t('meridiens.crossed.title')}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: '#6B6455',
                opacity: 0.9
              }}
            >
              {t('meridiens.crossed.subtitle')}
            </p>
          </>
        ) : (
          <>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(18px, 3vw, 24px)',
                fontStyle: 'italic',
                color: '#1A1A1A',
                opacity: 0.85,
                lineHeight: 1.5,
                marginBottom: 28
              }}
            >
              {userPos ? t(`meridiens.state.${state}`) : t('meridiens.state.lost')}
            </p>

            {/* Threshold list (clickable → hint drawer; one expanded at a time) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
              {thresholds.map((th) => {
                const visitedThis = visited.includes(th.id);
                const recognized = isAlignedWithLatitude(th);
                const name = language === 'fr' ? th.subtitleFR : th.subtitleEN;
                const hintKey = `meridiens.hint.${th.id}` as 'meridiens.hint.saint-sulpice' | 'meridiens.hint.horloge' | 'meridiens.hint.point-zero';
                const isExpanded = expandedThresholdId === th.id;
                const isReadExpanded = expandedReadId === th.id;
                const arrival = language === 'fr' ? th.arrivalContentFR : th.arrivalContentEN;
                return (
                  <div
                    key={th.id}
                    style={{
                      border: '1px solid transparent',
                      borderColor: recognized ? 'rgba(0,61,44,0.15)' : undefined,
                      background: recognized ? 'rgba(0,61,44,0.06)' : 'transparent',
                      borderRadius: 0
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedThresholdId === th.id) {
                          setExpandedThresholdId(null);
                          setExpandedReadId(null);
                        } else {
                          setExpandedThresholdId(th.id);
                          setExpandedReadId(null);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        opacity: visitedThis ? 0.85 : 1
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: visitedThis ? '#003D2C' : 'rgba(0,61,44,0.3)',
                          flexShrink: 0
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 13,
                          color: '#003D2C',
                          opacity: recognized ? 1 : 0.7,
                          flex: 1
                        }}
                      >
                        {name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 10,
                          letterSpacing: '0.05em',
                          color: '#6B6455',
                          opacity: 0.8
                        }}
                      >
                        {recognized ? t('meridiens.status.recognized') : t('meridiens.status.notRecognized')}
                      </span>
                    </button>
                    {isExpanded && (
                      <div
                        style={{
                          padding: '0 12px 12px 30px',
                          borderTop: 'none'
                        }}
                      >
                        <p
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: 12,
                            color: '#1A1A1A',
                            opacity: 0.85,
                            lineHeight: 1.5,
                            marginBottom: 8
                          }}
                        >
                          {t(hintKey)}
                        </p>
                        {!isReadExpanded ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedReadId(th.id);
                            }}
                            style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: 11,
                              letterSpacing: '0.05em',
                              color: '#003D2C',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              opacity: 0.8,
                              textDecoration: 'underline'
                            }}
                          >
                            {t('meridiens.read')}
                          </button>
                        ) : (
                          <>
                            <p
                              style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: 12,
                                color: '#1A1A1A',
                                opacity: 0.8,
                                lineHeight: 1.55,
                                whiteSpace: 'pre-wrap',
                                marginBottom: 8
                              }}
                            >
                              {arrival}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedReadId(null);
                              }}
                              style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: 11,
                                letterSpacing: '0.05em',
                                color: '#6B6455',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                opacity: 0.8,
                                textDecoration: 'underline'
                              }}
                            >
                              {t('meridiens.readLess')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!userPos && (
          <p
            style={{
              marginTop: 24,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: '#6B6455',
              opacity: 0.8
            }}
          >
            {t('meridiens.gps.hint')}
          </p>
        )}
      </div>
    </div>
  );
}

function getThresholdById(id: ThresholdId): Threshold | undefined {
  return getThresholds().find((t) => t.id === id);
}
