/**
 * ARCHÉ — Meridian instrument UI.
 * Frame, signal trace, hold ring, seal marks, calibration scale, revelation.
 * Driven by meridian snapshot or local-derived state; no fetch. Motion from motion.ts only.
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Navigation } from 'lucide-react';
import type { MeridianInstrumentSnapshot, MeridianPlaceId } from '../lib/api';
import { motion as motionTokens } from '../design/motion';
import { useTranslation } from '../utils/i18n';
import type { MeridienSignalQuality } from '../utils/meridien-geo';

/** Local fallback shape when snapshot has no world.meridian. */
export type LocalMeridianState = {
  state: MeridianInstrumentSnapshot['state'];
  alignmentIndex: number;
  holdProgress01: number;
  recognized: MeridianInstrumentSnapshot['recognized'];
  nearestPlaceId: MeridianPlaceId | null;
  micro?: MeridianInstrumentSnapshot['micro'];
};

/** Live reading: same as LocalMeridianState plus typed quality and optional hint (no wrong readings). */
export type MeridienLiveReading = LocalMeridianState & {
  quality: MeridienSignalQuality;
  hint?: string;
};

export type MeridianStateInput = MeridianInstrumentSnapshot | LocalMeridianState | MeridienLiveReading;

const FRAME_W = 220;
const FRAME_H = 340;
const SCALE_W = 200;
const SCALE_H = 24;
const TICK_COUNT = 41;
const GHOST_COUNT = 4;
const GHOST_INTERVAL = 400;

const SITES: Array<{ id: MeridianPlaceId; name: string; coords: string; revelation: string }> = [
  {
    id: 'saint-sulpice',
    name: 'Saint-Sulpice',
    coords: '48.8509° N, 2.3343° E',
    revelation: "La lumière a mesuré le temps ici\navant qu'on invente les horloges.",
  },
  {
    id: 'horloge',
    name: "Tour de l'Horloge",
    coords: '48.8556° N, 2.3458° E',
    revelation: "Le premier cadran public de Paris.\nLa ville a appris l'heure à cet endroit.",
  },
  {
    id: 'point-zero',
    name: 'Point Zéro',
    coords: '48.8534° N, 2.3488° E',
    revelation: 'Toutes les distances de France\npartent de sous vos pieds.',
  },
];

function SignalTrace({
  proximity,
  holdProgress,
  width,
  height,
  maturity,
  speedFactor = 1,
  arrivalTightness = 0,
}: {
  proximity: number;
  holdProgress: number;
  width: number;
  height: number;
  maturity: number;
  speedFactor?: number;
  arrivalTightness?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number>(0);
  const ghostsRef = useRef<number[][]>([]);
  const lastGhostTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const step = 3;
    const pointCount = Math.floor(height / step) + 1;
    const isLocked = holdProgress >= 1;
    const sf = Math.max(1, speedFactor);
    const jitterScale = 1 - arrivalTightness * 0.5;

    const render = () => {
      timeRef.current += 0.018 * sf;
      const t = timeRef.current;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const holdCalm = holdProgress * 0.4;
      const effectiveProximity = Math.min(1, proximity + holdCalm);

      const maxAmplitude = width * 0.35;
      const amplitude = maxAmplitude * Math.pow(1 - effectiveProximity, 1.8);
      const jitter = (1 - effectiveProximity) * 3.5 * jitterScale;
      const freq = 0.04 + (1 - effectiveProximity) * 0.06;
      const speed = 1.5 + (1 - effectiveProximity) * 4;
      const lineOpacity = 0.25 + effectiveProximity * 0.65;
      const lineWidth = 0.6 + effectiveProximity * 1.2;

      const currentXs: number[] = [];
      for (let i = 0; i < pointCount; i++) {
        const y = i * step;
        const normalY = y / height;
        const wave1 = Math.sin(normalY * Math.PI * 8 * freq * 10 + t * speed) * amplitude;
        const wave2 = Math.sin(normalY * Math.PI * 3.7 + t * speed * 0.7 + 1.3) * amplitude * 0.4;
        const wave3 = Math.cos(normalY * Math.PI * 13 + t * speed * 1.4) * amplitude * 0.15;
        const microTremble = (Math.random() - 0.5) * jitter;
        const drift = Math.sin(t * 0.3 + normalY * 0.5) * amplitude * 0.2;
        const x = centerX + wave1 + wave2 + wave3 + microTremble + drift;
        currentXs.push(Math.max(2, Math.min(width - 2, x)));
      }

      if (performance.now() - lastGhostTimeRef.current > GHOST_INTERVAL) {
        const cleanXs: number[] = [];
        for (let i = 0; i < pointCount; i++) {
          const y = i * step;
          const normalY = y / height;
          const wave1 = Math.sin(normalY * Math.PI * 8 * freq * 10 + t * speed) * amplitude;
          const wave2 = Math.sin(normalY * Math.PI * 3.7 + t * speed * 0.7 + 1.3) * amplitude * 0.4;
          const wave3 = Math.cos(normalY * Math.PI * 13 + t * speed * 1.4) * amplitude * 0.15;
          const drift = Math.sin(t * 0.3 + normalY * 0.5) * amplitude * 0.2;
          cleanXs.push(Math.max(2, Math.min(width - 2, centerX + wave1 + wave2 + wave3 + drift)));
        }
        ghostsRef.current.push(cleanXs);
        if (ghostsRef.current.length > GHOST_COUNT) ghostsRef.current.shift();
        lastGhostTimeRef.current = performance.now();
      }

      const ghosts = ghostsRef.current;
      for (let g = 0; g < ghosts.length; g++) {
        const ghostXs = ghosts[g];
        const age = (ghosts.length - g) / ghosts.length;
        const ghostOpacity = (1 - age) * 0.12 * (0.5 + effectiveProximity * 0.5);
        if (ghostOpacity < 0.005) continue;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 61, 44, ${ghostOpacity})`;
        ctx.lineWidth = Math.max(0.3, lineWidth * 0.5);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (let i = 0; i < ghostXs.length; i++) {
          const y = i * step;
          if (i === 0) ctx.moveTo(ghostXs[i], y);
          else ctx.lineTo(ghostXs[i], y);
        }
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.strokeStyle = `rgba(0, 61, 44, ${lineOpacity})`;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let i = 0; i < currentXs.length; i++) {
        const y = i * step;
        if (i === 0) ctx.moveTo(currentXs[i], y);
        else ctx.lineTo(currentXs[i], y);
      }
      ctx.stroke();

      if (effectiveProximity > 0.85) {
        const nodeOpacity = (effectiveProximity - 0.85) / 0.15;
        const nodeY = height / 2 + Math.sin(t * 0.8) * (isLocked ? 2 : 8);
        ctx.fillStyle = `rgba(0, 61, 44, ${nodeOpacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(centerX, nodeY, 2 + effectiveProximity, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, [proximity, holdProgress, width, height, maturity, speedFactor, arrivalTightness]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    />
  );
}

function HoldRing({ progress, visible }: { progress: number; visible: boolean }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - progress);
  const durationMs = motionTokens.t('measured');
  const ease = motionTokens.ease('transition');

  return (
    <motion.div
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: durationMs / 1000, ease }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9,
      }}
    >
      <svg width={radius * 2 + 8} height={radius * 2 + 8} style={{ overflow: 'visible' }}>
        <circle
          cx={radius + 4}
          cy={radius + 4}
          r={radius}
          fill="none"
          stroke="#003D2C"
          strokeWidth="0.5"
          opacity={0.06}
        />
        <circle
          cx={radius + 4}
          cy={radius + 4}
          r={radius}
          fill="none"
          stroke="#003D2C"
          strokeWidth="0.5"
          opacity={0.4 * progress}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius + 4} ${radius + 4})`}
          style={{ transition: `stroke-dashoffset ${durationMs * 0.15}ms linear, opacity ${durationMs * 0.3}ms ${ease}` }}
        />
      </svg>
    </motion.div>
  );
}

function SealMarks({
  recognizedSites,
  sites,
}: {
  recognizedSites: Set<string>;
  sites: typeof SITES;
}) {
  const hasAny = recognizedSites.size > 0;
  const durationMs = motionTokens.t('contemplative');

  return (
    <motion.div
      animate={{ opacity: hasAny ? 1 : 0 }}
      transition={{ duration: durationMs / 1000, ease: motionTokens.ease('transition') }}
      style={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
        zIndex: 8,
      }}
    >
      {sites.map((site) => {
        const isRecognized = recognizedSites.has(site.id);
        return (
          <motion.div
            key={site.id}
            animate={{
              opacity: isRecognized ? 0.6 : 0.1,
              scale: isRecognized ? 1 : 0.8,
            }}
            transition={{ duration: durationMs * 0.8 / 1000 }}
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: isRecognized ? '#003D2C' : 'transparent',
              border: `0.5px solid rgba(0, 61, 44, ${isRecognized ? 0.6 : 0.15})`,
            }}
          />
        );
      })}
    </motion.div>
  );
}

function InstrumentFrame({
  proximity,
  holdProgress,
  recognizedSites,
  maturity,
  speedFactor = 1,
  arrivalTightness = 0,
  smoothedHeadingDeg = null,
  children,
}: {
  proximity: number;
  holdProgress: number;
  recognizedSites: Set<string>;
  maturity: number;
  speedFactor?: number;
  arrivalTightness?: number;
  /** Smoothed device heading (degrees, 0 = North). When set, a compass needle is drawn. */
  smoothedHeadingDeg?: number | null;
  children: React.ReactNode;
}) {
  const isLocked = holdProgress >= 1;
  const HOLD_THRESHOLD = 0.82;
  const isHolding = proximity >= HOLD_THRESHOLD && holdProgress > 0 && holdProgress < 1;

  const borderOpacity = 0.12 + proximity * 0.15 + maturity * 0.04;
  const tickBoost = maturity * 0.03;
  const axisOpacity = 0.08 + maturity * 0.02;

  return (
    <div style={{ position: 'relative', width: FRAME_W, height: FRAME_H }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `0.5px solid rgba(0, 61, 44, ${Math.min(0.5, borderOpacity)})`,
          pointerEvents: 'none',
          transition: 'border-color 1s ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '0.5px',
          backgroundColor: `rgba(0, 61, 44, ${axisOpacity})`,
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          transition: 'background-color 2s ease',
        }}
      />
      <svg
        width={FRAME_W}
        height={FRAME_H}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {Array.from({ length: 35 }).map((_, i) => {
          const y = (i + 1) * (FRAME_H / 36);
          const isMajor = i % 5 === 0;
          const tickLen = isMajor ? 10 : 5;
          const baseOpacity = isMajor ? 0.2 : 0.08;
          const opacity = Math.min(0.5, baseOpacity + tickBoost);
          return (
            <g key={`tick-${i}`}>
              <line
                x1={0}
                y1={y}
                x2={tickLen}
                y2={y}
                stroke="#003D2C"
                strokeWidth="0.5"
                opacity={opacity}
              />
              <line
                x1={FRAME_W}
                y1={y}
                x2={FRAME_W - tickLen}
                y2={y}
                stroke="#003D2C"
                strokeWidth="0.5"
                opacity={opacity}
              />
            </g>
          );
        })}
        <line
          x1={0}
          y1={FRAME_H / 2}
          x2={FRAME_W}
          y2={FRAME_H / 2}
          stroke="#003D2C"
          strokeWidth="0.5"
          opacity={0.06 + tickBoost}
          strokeDasharray="2 6"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          right: -28,
          top: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: FRAME_H * 0.08,
          paddingBottom: FRAME_H * 0.08,
          pointerEvents: 'none',
        }}
      >
        {['DISPERSION', 'INTERFÉRENCE', 'RÉSONANCE'].map((zone, i) => {
          const zoneRanges: [number, number][] = [[0, 0.35], [0.35, 0.75], [0.75, 1.01]];
          const [lo, hi] = zoneRanges[i];
          const isActive = proximity >= lo && proximity < hi;
          return (
            <span
              key={zone}
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                fontFamily: 'monospace',
                fontSize: '7px',
                letterSpacing: '0.2em',
                color: '#003D2C',
                opacity: isActive ? 0.6 : 0.15,
                transition: 'opacity 0.8s ease',
              }}
            >
              {zone}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: FRAME_W,
          height: FRAME_H,
          overflow: 'hidden',
        }}
      >
        <SignalTrace
          proximity={proximity}
          holdProgress={holdProgress}
          width={FRAME_W}
          height={FRAME_H}
          maturity={maturity}
          speedFactor={speedFactor}
          arrivalTightness={arrivalTightness}
        />
      </div>
      {smoothedHeadingDeg != null && Number.isFinite(smoothedHeadingDeg) && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: FRAME_W / 2,
            top: FRAME_H / 2,
            width: 0,
            height: 0,
            transform: `translate(-50%, -50%) rotate(${-smoothedHeadingDeg}deg)`,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -1,
              bottom: 0,
              width: 2,
              height: 28,
              background: 'linear-gradient(to top, rgba(0,61,44,0.9), rgba(0,61,44,0.4))',
              borderRadius: 1,
              boxShadow: '0 0 4px rgba(0,61,44,0.2)',
            }}
          />
        </div>
      )}
      <HoldRing progress={holdProgress} visible={isHolding || isLocked} />
      <SealMarks recognizedSites={recognizedSites} sites={SITES} />
      {children}
    </div>
  );
}

function CalibrationScale({ proximity }: { proximity: number }) {
  const dotX = proximity * SCALE_W;
  const durationMs = motionTokens.t('brisk');

  return (
    <div
      style={{
        position: 'relative',
        width: SCALE_W,
        height: SCALE_H + 20,
        marginTop: 20,
      }}
    >
      <div style={{ position: 'relative', width: SCALE_W, height: SCALE_H }}>
        <svg width={SCALE_W} height={SCALE_H} style={{ position: 'absolute', top: 0, left: 0 }}>
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const x = (i / (TICK_COUNT - 1)) * SCALE_W;
            const isMajor = i % 10 === 0;
            const isMid = i % 5 === 0 && !isMajor;
            const tickH = isMajor ? 10 : isMid ? 7 : 4;
            const opacity = isMajor ? 0.3 : isMid ? 0.18 : 0.08;
            return (
              <line
                key={i}
                x1={x}
                y1={SCALE_H - tickH}
                x2={x}
                y2={SCALE_H}
                stroke="#003D2C"
                strokeWidth="0.5"
                opacity={opacity}
              />
            );
          })}
          <line
            x1={0}
            y1={SCALE_H}
            x2={SCALE_W}
            y2={SCALE_H}
            stroke="#003D2C"
            strokeWidth="0.5"
            opacity={0.15}
          />
        </svg>
        <motion.div
          animate={{ left: dotX }}
          transition={{
            type: 'spring',
            stiffness: 120,
            damping: 20,
            duration: durationMs / 1000,
          }}
          style={{
            position: 'absolute',
            bottom: -1,
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: '#003D2C',
            transform: 'translateX(-50%)',
            opacity: 0.7,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontFamily: 'monospace',
          fontSize: '7px',
          letterSpacing: '0.1em',
          color: '#003D2C',
          opacity: 0.25,
          textTransform: 'uppercase',
        }}
      >
        <span>0</span>
        <span>1</span>
      </div>
    </div>
  );
}

function Revelation({ text, visible }: { text: string; visible: boolean }) {
  const lines = text.split('\n');
  const durationMs = motionTokens.t('contemplative');
  const delayMs = motionTokens.t('measured');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{
        duration: durationMs * 3 / 1000,
        delay: visible ? delayMs * 2.5 / 1000 : 0,
        ease: motionTokens.ease('transition'),
      }}
      style={{
        position: 'absolute',
        bottom: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {lines.map((line, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: visible ? 0.4 : 0, y: visible ? 0 : 6 }}
          transition={{
            duration: 2,
            delay: visible ? 3 + i * 0.8 : 0,
            ease: motionTokens.ease('appear'),
          }}
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: '12px',
            fontStyle: 'italic',
            letterSpacing: '0.02em',
            color: '#003D2C',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {line}
        </motion.span>
      ))}
    </motion.div>
  );
}

const INTRO_SKIP_KEY = 'arche_meridian_intro_seen';

type IntroPhase = 'idle' | 'calibration' | 'measuring';

const HEADING_SMOOTH_ALPHA = 0.18;

/** Shortest angular difference in [-180, 180] so EMA doesn't jump at 359°→0°. */
function shortestAngleDiff(toDeg: number, fromDeg: number): number {
  return ((toDeg - fromDeg) % 360 + 540) % 360 - 180;
}

function normalizeAngle360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export interface MeridiensInterfaceProps {
  meridian: MeridianStateInput;
  /** Device heading in degrees (0 = North). Optional; when set, a compass needle is shown with UI smoothing. */
  headingDeg?: number;
  onExit: () => void;
  speedFactor?: number;
  arrivalTightness?: number;
}

export function MeridiensInterface({ meridian, headingDeg, onExit, speedFactor = 1, arrivalTightness = 0 }: MeridiensInterfaceProps) {
  const { t } = useTranslation();
  const smoothedHeadingRef = useRef<number | null>(null);
  const [smoothedHeading, setSmoothedHeading] = useState<number | null>(null);
  useEffect(() => {
    if (headingDeg == null || !Number.isFinite(headingDeg)) {
      smoothedHeadingRef.current = null;
      setSmoothedHeading(null);
      return;
    }
    const prev = smoothedHeadingRef.current;
    const next =
      prev == null
        ? headingDeg
        : normalizeAngle360(prev + HEADING_SMOOTH_ALPHA * shortestAngleDiff(headingDeg, prev));
    smoothedHeadingRef.current = next;
    setSmoothedHeading(next);
  }, [headingDeg]);

  const [introPhase, setIntroPhase] = useState<IntroPhase>(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(INTRO_SKIP_KEY)) {
      return 'measuring';
    }
    return 'idle';
  });
  const [showRevelation, setShowRevelation] = useState(false);

  const proximity = meridian.alignmentIndex;
  const holdProgress = meridian.holdProgress01;
  const recognizedSites = new Set(
    meridian.recognized.filter((r) => r.status === 'RECONNU').map((r) => r.placeId)
  );
  const activeIndex = meridian.nearestPlaceId
    ? SITES.findIndex((s) => s.id === meridian.nearestPlaceId)
    : 0;
  const activeSiteIndex = activeIndex >= 0 ? activeIndex : 0;
  const site = SITES[activeSiteIndex];
  const maturity = recognizedSites.size;
  const isLocked = holdProgress >= 1;

  useEffect(() => {
    if (isLocked && recognizedSites.has(site.id)) setShowRevelation(true);
  }, [isLocked, recognizedSites, site.id]);

  const stateLabel =
    meridian.state === 'EGARE'
      ? t('meridiens.instrument.state.egare')
      : meridian.state === 'PROCHE'
        ? t('meridiens.instrument.state.dispersion')
        : meridian.state === 'SUR_LIGNE'
          ? t('meridiens.instrument.state.interference')
          : t('meridiens.instrument.state.axe');

  let statusMsg = '';
  if (meridian.state === 'EGARE') statusMsg = meridian.micro?.statusLine ?? '';
  if (meridian.state === 'PROCHE') statusMsg = meridian.micro?.statusLine ?? '';
  if (meridian.state === 'SUR_LIGNE') statusMsg = meridian.micro?.statusLine ?? '';
  if (meridian.state === 'ALIGNE') statusMsg = '';

  const currentSiteSealed = recognizedSites.has(site.id);
  const sealText = currentSiteSealed && isLocked ? 'Le lieu reconnaît.' : '';

  const introIdleMs = motionTokens.ms.introIdle;
  const introCalMs = motionTokens.ms.introCal;

  const showInstrument = introPhase === 'measuring';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: '#FAF9F6',
        color: '#003D2C',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      {/* Desktop device surface: single vignette layer, opacity ≤ 0.06 (Patch 5) */}
      <style>{`
        @media (min-width: 769px) {
          .meridiens-vignette {
            display: block !important;
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 1;
            background: radial-gradient(ellipse at center, transparent 40%, rgba(0,61,44,0.04) 100%);
            opacity: 0.06;
          }
        }
      `}</style>
      <div className="meridiens-vignette" aria-hidden />

      <motion.div
        animate={{
          opacity: isLocked ? 0 : 0.04 + (1 - proximity) * 0.04,
        }}
        transition={{ duration: 2, ease: motionTokens.ease('transition') }}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.nav
        animate={{ opacity: isLocked ? 0 : 1, y: isLocked ? -16 : 0 }}
        transition={{
          duration: motionTokens.t('measured') / 1000,
          ease: motionTokens.ease('transition'),
        }}
        style={{
          position: 'absolute',
          top: 24,
          left: 0,
          width: '100%',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
        }}
      >
        <button
          type="button"
          onClick={onExit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: 0.5,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#003D2C',
            fontFamily: 'monospace',
          }}
        >
          <ArrowLeft size={11} strokeWidth={1} />
          <span>Retour</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Navigation size={10} style={{ opacity: 0.4 }} />
          <span
            style={{
              fontSize: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              opacity: 0.4,
            }}
          >
            {t('meridiens.instrument.title')}
          </span>
        </div>
      </motion.nav>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {introPhase === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onAnimationComplete={() => {
              sessionStorage.setItem(INTRO_SKIP_KEY, '1');
              setIntroPhase('calibration');
            }}
            transition={{
              duration: introIdleMs / 1000,
              ease: motionTokens.ease('appear'),
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.4,
            }}
          >
            {t('meridiens.instrument.sleep')}
          </motion.div>
        )}

        {introPhase === 'calibration' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onAnimationComplete={() => setIntroPhase('measuring')}
            transition={{
              duration: introCalMs / 1000,
              ease: motionTokens.ease('appear'),
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '8px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.5,
            }}
          >
            {t('meridiens.instrument.calibration')}
          </motion.div>
        )}

        {showInstrument && (
          <>
            <motion.div
              animate={{
                opacity: isLocked ? 0.9 : 0.3 + proximity * 0.3,
                filter: `blur(${isLocked ? 0 : (1 - proximity) * 6}px)`,
              }}
              transition={{
                duration: motionTokens.t('measured') / 1000,
                ease: motionTokens.ease('transition'),
              }}
              style={{
                marginBottom: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: '8px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  opacity: 0.5,
                  fontFamily: 'monospace',
                }}
              >
                {site.coords}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: '18px',
                  fontWeight: 300,
                  letterSpacing: '0.04em',
                }}
              >
                {site.name}
              </span>
            </motion.div>

            <InstrumentFrame
              proximity={proximity}
              holdProgress={holdProgress}
              recognizedSites={recognizedSites}
              maturity={maturity}
              speedFactor={speedFactor}
              arrivalTightness={arrivalTightness}
              smoothedHeadingDeg={smoothedHeading}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                <motion.div
                  key={stateLabel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: motionTokens.t('brisk') / 1000,
                    ease: motionTokens.ease('appear'),
                  }}
                  style={{
                    padding: '3px 10px',
                    border: isLocked
                      ? '0.5px solid rgba(0, 61, 44, 0.8)'
                      : '0.5px solid rgba(0, 61, 44, 0.12)',
                    backgroundColor: isLocked ? '#003D2C' : 'rgba(250, 249, 246, 0.85)',
                    color: isLocked ? '#FAF9F6' : '#003D2C',
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.25em',
                    fontFamily: 'monospace',
                    transition: `all ${motionTokens.t('brisk')}ms ${motionTokens.ease('transition')}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stateLabel}
                </motion.div>

                {statusMsg && (
                  <motion.span
                    key={statusMsg}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{
                      duration: motionTokens.t('brisk') * 0.5 / 1000,
                      ease: motionTokens.ease('appear'),
                    }}
                    style={{
                      fontSize: '7px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'rgba(250, 249, 246, 0.7)',
                      padding: '1px 4px',
                    }}
                  >
                    {statusMsg}
                  </motion.span>
                )}

                {sealText && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 0.35, y: 0 }}
                    transition={{
                      duration: motionTokens.t('stone') / 1000,
                      delay: motionTokens.t('brisk') * 0.8 / 1000,
                      ease: motionTokens.ease('appear'),
                    }}
                    style={{
                      fontFamily: 'var(--font-serif, Georgia, serif)',
                      fontSize: '11px',
                      fontStyle: 'italic',
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                      marginTop: 4,
                    }}
                  >
                    {sealText}
                  </motion.span>
                )}
              </div>
            </InstrumentFrame>

            <motion.div
              animate={{ opacity: isLocked ? 0 : 1 }}
              transition={{
                duration: motionTokens.t('contemplative') / 1000,
                ease: motionTokens.ease('transition'),
              }}
            >
              <CalibrationScale proximity={proximity} />
            </motion.div>
          </>
        )}
      </div>

      <Revelation text={site.revelation} visible={showRevelation} />
    </div>
  );
}
