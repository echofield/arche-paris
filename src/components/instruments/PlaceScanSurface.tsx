/**
 * PLACE SCAN SURFACE — Transmission Instrument (Lecture du lieu)
 *
 * The city finishes a sentence the user started by standing there.
 * Backend returns exactly 4 elements (fixed order): landmark, cultural, spatial, now.
 * One thought finishing itself. Orientation without navigation.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { api, type PlaceScanDirection, type PlaceScanNowState, type PlaceScanResult } from '../../lib/api';
import { useTranslation } from '../../utils/i18n';
import { getStabilizedFix } from '../../lib/getStabilizedFix';

// ============================================================
// Backend contract: PlaceScanResult cards[0..3]
//   ① landmark   — label, direction (N/NE/...), distance
//   ② cultural   — line (one sentence)
//   ③ spatial    — identity (one word)
//   ④ now        — state: opening|active|transition|quiet
// No landmark coordinates returned. Compass arc from direction enum.
// ============================================================

interface PlaceScanSurfaceProps {
  onExit: () => void;
}

const C = {
  paper: '#FAF9F4',
  ink: '#003D2C',
  gold: '#A38767',
  night: '#1A1A1A',
};

const MO = {
  measured: { duration: 0.9, ease: [0.4, 0, 0.2, 1] as const },
  gentle: { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] as const },
  slow: { duration: 2.4, ease: [0.4, 0, 0.2, 1] as const },
  emerge: { duration: 1.8, ease: [0.25, 0.1, 0.25, 1] as const },
  deep: { duration: 3.0, ease: [0.22, 0.08, 0.36, 1] as const },
};

type Phase = 'idle' | 'listening' | 'reading';
type NowState = PlaceScanNowState;

interface PlaceReading {
  landmark: string;
  direction: PlaceScanDirection;
  culturalLine: string;
  spatialIdentity: string;
  nowState: NowState;
  furtherLabel?: string | null;
}

/** Direction enum → degrees (compass: N=0, NE=45, ...). */
const DIRECTION_TO_DEG: Record<PlaceScanDirection, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

const ATMOSPHERE: Record<NowState, {
  radialColor: string;
  grainOpacity: number;
  breathDuration: number;
  apertureOpacity: [number, number];
}> = {
  opening: {
    radialColor: 'rgba(163,135,103,0.03)',
    grainOpacity: 0.035,
    breathDuration: 18,
    apertureOpacity: [0.28, 0.40],
  },
  active: {
    radialColor: 'rgba(0,61,44,0.025)',
    grainOpacity: 0.04,
    breathDuration: 15,
    apertureOpacity: [0.30, 0.42],
  },
  transition: {
    radialColor: 'rgba(0,61,44,0.035)',
    grainOpacity: 0.05,
    breathDuration: 20,
    apertureOpacity: [0.25, 0.35],
  },
  quiet: {
    radialColor: 'rgba(26,26,26,0.02)',
    grainOpacity: 0.055,
    breathDuration: 24,
    apertureOpacity: [0.20, 0.30],
  },
};

function resultToReading(data: PlaceScanResult): PlaceReading {
  const [landmark, cultural, spatial, now] = data.cards;
  return {
    landmark: landmark.label,
    direction: landmark.direction,
    culturalLine: cultural.line,
    spatialIdentity: spatial.identity,
    nowState: now.state,
    furtherLabel: data.further_label ?? null,
  };
}

function useDeviceHeading(active: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);
  const permissionRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const handler = (e: DeviceOrientationEvent) => {
      const ev = e as { webkitCompassHeading?: number; alpha?: number };
      const h = ev.webkitCompassHeading ?? (ev.alpha != null ? (360 - ev.alpha) % 360 : null);
      if (h != null) setHeading(h);
    };

    const init = async () => {
      if (permissionRef.current) return;
      try {
        const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof DOE.requestPermission === 'function') {
          const state = await DOE.requestPermission();
          if (state !== 'granted') return;
        }
        permissionRef.current = true;
        window.addEventListener('deviceorientation', handler, true);
      } catch {
        // No compass
      }
    };

    init();
    if (!permissionRef.current) {
      window.addEventListener('deviceorientation', handler, true);
    }

    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [active]);

  return heading;
}

function useSimulatedHeading(realHeading: number | null, active: boolean): number | null {
  const [sim, setSim] = useState<number | null>(null);
  const angleRef = useRef(Math.random() * 360);

  useEffect(() => {
    if (realHeading !== null || !active) {
      setSim(null);
      return;
    }
    const id = setInterval(() => {
      angleRef.current = (angleRef.current + 0.15) % 360;
      setSim(angleRef.current);
    }, 50);
    return () => clearInterval(id);
  }, [realHeading, active]);

  return realHeading ?? sim;
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

const APT = 140;
const TICK_N = 12;

function SensingAperture({
  phase,
  atmosphere,
  heading,
  directionDeg,
  alignment,
  onTap,
}: {
  phase: Phase;
  atmosphere: (typeof ATMOSPHERE)['active'];
  heading: number | null;
  directionDeg: number | null;
  alignment: number;
  onTap: () => void;
}) {
  const r = APT / 2;

  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_N }, (_, i) => {
        const ang = (i * 30 * Math.PI) / 180 - Math.PI / 2;
        const major = i % 3 === 0;
        const ri = major ? r - 3 : r - 1.5;
        const ro = major ? r + 6 : r + 3.5;
        return {
          x1: Math.cos(ang) * ri,
          y1: Math.sin(ang) * ri,
          x2: Math.cos(ang) * ro,
          y2: Math.sin(ang) * ro,
          op: major ? 0.14 : 0.06,
          w: major ? 0.5 : 0.3,
        };
      }),
    [r]
  );

  const northAngle = heading != null ? toRad(-heading - 90) : toRad(-90);

  // Arc relative to device: direction (e.g. N=0°) in world, minus heading → where to draw glow
  const arcRelative = useMemo(() => {
    if (heading == null || directionDeg == null) return null;
    return ((directionDeg - heading) % 360 + 360) % 360;
  }, [heading, directionDeg]);

  const glowArc = useMemo(() => {
    if (arcRelative == null) return null;
    const halfArc = 25;
    const startDeg = arcRelative - halfArc - 90;
    const endDeg = arcRelative + halfArc - 90;
    const sR = toRad(startDeg);
    const eR = toRad(endDeg);
    const x1 = Math.cos(sR) * r;
    const y1 = Math.sin(sR) * r;
    const x2 = Math.cos(eR) * r;
    const y2 = Math.sin(eR) * r;
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  }, [arcRelative, r]);

  const scaleRange =
    phase === 'listening'
      ? [1, 1.025, 0.995, 1.018, 1]
      : phase === 'reading'
        ? [1 - alignment * 0.025, 1.008 - alignment * 0.02, 1 - alignment * 0.025]
        : [1, 1.012, 1];

  const opRange =
    phase === 'listening'
      ? [0.35, 0.55, 0.38, 0.50, 0.35]
      : phase === 'reading'
        ? [
            atmosphere.apertureOpacity[0] + alignment * 0.06,
            atmosphere.apertureOpacity[1] + alignment * 0.06,
            atmosphere.apertureOpacity[0] + alignment * 0.06,
          ]
        : [0.18, 0.28, 0.18];

  const breathDur =
    phase === 'listening' ? 2.8 : phase === 'reading' ? atmosphere.breathDuration + alignment * 4 : 16;

  return (
    <div
      onClick={phase !== 'listening' ? onTap : undefined}
      style={{
        position: 'relative',
        width: APT + 50,
        height: APT + 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: phase === 'listening' ? 'default' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{
          background:
            phase === 'reading'
              ? `radial-gradient(circle, ${atmosphere.radialColor} 0%, transparent 68%)`
              : phase === 'listening'
                ? 'radial-gradient(circle, rgba(0,61,44,0.03) 0%, transparent 68%)'
                : 'radial-gradient(circle, rgba(0,61,44,0.015) 0%, transparent 68%)',
        }}
        transition={{ duration: 3, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: APT * 3.2,
          height: APT * 3.2,
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <motion.svg
        width={APT + 30}
        height={APT + 30}
        viewBox={`${-(r + 15)} ${-(r + 15)} ${APT + 30} ${APT + 30}`}
        animate={{ scale: scaleRange, opacity: opRange }}
        transition={{
          duration: breathDur,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ overflow: 'visible' }}
      >
        <circle cx={0} cy={0} r={r} fill="none" stroke={C.ink} strokeWidth={0.5} />
        <circle cx={0} cy={0} r={r * 0.3} fill="none" stroke={C.ink} strokeWidth={0.25} opacity={0.06} />
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={C.ink}
            strokeWidth={t.w}
            opacity={t.op}
          />
        ))}
        {phase === 'reading' && heading != null && (
          <circle
            cx={Math.cos(northAngle) * (r + 10)}
            cy={Math.sin(northAngle) * (r + 10)}
            r={1.2}
            fill={C.ink}
            opacity={0.1}
          />
        )}
        {phase === 'reading' && glowArc && (
          <>
            <motion.path
              d={glowArc}
              fill="none"
              stroke={C.ink}
              strokeWidth={3.5}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.04 + alignment * 0.04 }}
              transition={{ duration: 2 }}
            />
            <motion.path
              d={glowArc}
              fill="none"
              stroke={C.ink}
              strokeWidth={1.2}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 + alignment * 0.1 }}
              transition={{ duration: 2 }}
            />
          </>
        )}
        <circle
          cx={0}
          cy={0}
          r={1}
          fill={C.ink}
          opacity={phase === 'listening' ? 0.4 : 0.15}
        />
      </motion.svg>

      <AnimatePresence>
        {phase === 'listening' &&
          [0, 1, 2].map((i) => (
            <motion.div
              key={`pulse-${i}`}
              initial={{ scale: 0.45, opacity: 0.15 }}
              animate={{ scale: 3.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3.8,
                delay: i * 1.1,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                position: 'absolute',
                width: APT * 0.55,
                height: APT * 0.55,
                borderRadius: '50%',
                border: `0.4px solid ${C.ink}`,
                pointerEvents: 'none',
              }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}

function PerceptionField({ phase }: { phase: Phase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const particlesRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; size: number; baseOp: number; drift: number }>
  >([]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = W * dpr;
    cvs.height = H * dpr;
    cvs.style.width = `${W}px`;
    cvs.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const n = phase === 'listening' ? 14 : phase === 'reading' ? 9 : 7;
    const cx = W / 2;
    const cy = H / 2;

    particlesRef.current = Array.from({ length: n }, () => {
      const a = Math.random() * Math.PI * 2;
      const d = 60 + Math.random() * Math.min(W, H) * 0.38;
      return {
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.035,
        size: 0.35 + Math.random() * 0.5,
        baseOp: 0.012 + Math.random() * 0.028,
        drift: Math.random() * Math.PI * 2,
      };
    });

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      const rate = phase === 'listening' ? 0.005 : 0.0018;
      for (const p of particlesRef.current) {
        p.drift += rate;
        p.x += p.vx + Math.sin(p.drift) * 0.035;
        p.y += p.vy + Math.cos(p.drift * 0.6) * 0.02;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
        const b = 0.5 + 0.5 * Math.sin(p.drift);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,61,44,${p.baseOp * (0.5 + b * 0.5)})`;
        ctx.fill();
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frameRef.current);
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
    />
  );
}

function angleDiff(a: number, b: number): number {
  const d = ((a - b) % 360 + 540) % 360 - 180;
  return Math.abs(d);
}

export function PlaceScanSurface({ onExit }: PlaceScanSurfaceProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('idle');
  const [reading, setReading] = useState<PlaceReading | null>(null);
  const [errorHint, setErrorHint] = useState<null | 'auth' | 'generic'>(null);

  const rawHeading = useDeviceHeading(phase === 'listening' || phase === 'reading');
  const heading = useSimulatedHeading(rawHeading, phase === 'reading');

  const atmo = reading ? ATMOSPHERE[reading.nowState] : ATMOSPHERE.active;

  const directionDeg = useMemo(
    () => (reading ? DIRECTION_TO_DEG[reading.direction] : null),
    [reading]
  );

  const alignment = useMemo(() => {
    if (heading == null || directionDeg == null || phase !== 'reading') return 0;
    const diff = angleDiff(directionDeg, heading);
    return Math.max(0, 1 - diff / 40);
  }, [heading, directionDeg, phase]);

  // Hysteresis for "so what" hint: show above 0.55, hide below 0.45 to avoid flicker when alignment is noisy
  const [showAlignedHint, setShowAlignedHint] = useState(false);
  useEffect(() => {
    if (alignment > 0.55) setShowAlignedHint(true);
    else if (alignment < 0.45) setShowAlignedHint(false);
  }, [alignment]);

  const textClarify = alignment * 0.08;

  const scan = useCallback(async () => {
    if (phase === 'listening') return;
    setReading(null);
    setPhase('listening');

    let lat = 48.8566;
    let lon = 2.3522;
    let hdg: number | undefined;

    try {
      const fix = await getStabilizedFix({ durationMs: 4000, intervalMs: 500 });
      if (fix) {
        lat = fix.lat;
        lon = fix.lng;
        if (fix.heading !== null) hdg = fix.heading;
      }
    } catch {
      /* fallback Paris center */
    }

    const result = await api.placeScan({ lat, lon, heading: hdg });

    if (result.error || !result.data) {
      const normalizedError = (result.error ?? '').toLowerCase();
      const isAuthIssue =
        normalizedError.includes('401') ||
        normalizedError.includes('auth') ||
        normalizedError.includes('missing or invalid authorization');
      setErrorHint(isAuthIssue ? 'auth' : 'generic');
      setPhase('idle');
      return;
    }

    setErrorHint(null);
    setReading(resultToReading(result.data));
    setPhase('reading');
  }, [phase]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        overflow: 'hidden',
        backgroundColor: C.paper,
        color: C.ink,
        fontFamily: '"Inter", system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        overscrollBehavior: 'none',
      }}
    >
      <motion.div
        animate={{ opacity: phase === 'reading' ? atmo.grainOpacity : 0.04 }}
        transition={{ duration: 3, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      <PerceptionField phase={phase} />

      <motion.div
        animate={{
          background:
            phase === 'reading' && reading
              ? `radial-gradient(circle at 50% 42%, ${ATMOSPHERE[reading.nowState].radialColor} 0%, transparent 55%)`
              : 'radial-gradient(circle at 50% 42%, transparent 0%, transparent 55%)',
        }}
        transition={{ duration: 4, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}
      />

      <nav
        style={{
          position: 'relative',
          zIndex: 50,
          padding: '20px 24px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={onExit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: 0.35,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: C.ink,
            fontFamily: '"Inter", system-ui, sans-serif',
            padding: '14px 10px 14px 0',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          <ArrowLeft size={13} strokeWidth={1.2} />
          <span>{t('instruments.back', 'Retour')}</span>
        </button>
      </nav>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 36px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ minHeight: 22, marginBottom: 18, textAlign: 'center' }}>
          <AnimatePresence mode="wait">
            {phase === 'reading' && reading && (
              <>
                <motion.span
                  key={`lm-${reading.landmark}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.35 + textClarify }}
                  exit={{ opacity: 0 }}
                  transition={{ ...MO.emerge, delay: 0.6 }}
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.28em',
                    fontFamily: '"Inter", system-ui, sans-serif',
                  }}
                >
                  {reading.landmark}
                </motion.span>
                {reading.furtherLabel && (
                  <motion.span
                    key={`fl-${reading.furtherLabel}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.28 + textClarify * 0.5 }}
                    transition={{ ...MO.emerge, delay: 0.9 }}
                    style={{
                      display: 'block',
                      marginTop: 8,
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      fontFamily: '"Inter", system-ui, sans-serif',
                    }}
                  >
                    {t('instruments.placeScan.further', 'Plus loin :')} {reading.furtherLabel}
                  </motion.span>
                )}
              </>
            )}
          </AnimatePresence>
        </div>

        <SensingAperture
          phase={phase}
          atmosphere={atmo}
          heading={heading}
          directionDeg={directionDeg}
          alignment={alignment}
          onTap={scan}
        />

        <AnimatePresence>
          {phase === 'idle' && (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.22 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              transition={{ ...MO.slow, delay: 0.5 }}
              onClick={scan}
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '16px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '0.04em',
                marginTop: 24,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {t('instruments.placeScan.cta', 'Lire le lieu.')}
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'idle' && errorHint && (
            <motion.span
              key="error-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              exit={{ opacity: 0 }}
              transition={MO.gentle}
              onClick={scan}
              style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: '11px',
                letterSpacing: '0.08em',
                marginTop: 24,
                cursor: 'pointer',
                maxWidth: 260,
                textAlign: 'center',
              }}
            >
              {errorHint === 'auth'
                ? t('instruments.placeScan.authError', 'Connexion refusée. Vérifiez votre session.')
                : t('instruments.placeScan.error', 'Signal faible. Impossible de lire le lieu.')}
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'reading' && reading && (
            <div
              key={`thought-${reading.landmark}`}
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: 22,
                maxWidth: 295,
              }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.58 + textClarify }}
                transition={{ ...MO.emerge, delay: 1.2 }}
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: '19px',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  lineHeight: 1.7,
                  margin: 0,
                  letterSpacing: '0.012em',
                }}
              >
                {reading.culturalLine}
              </motion.p>

              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.22 + textClarify * 0.5 }}
                transition={{ ...MO.emerge, delay: 2 }}
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.42em',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  marginTop: 18,
                  fontWeight: 500,
                }}
              >
                {reading.spatialIdentity}
              </motion.span>

              {showAlignedHint && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 + alignment * 0.15 }}
                  transition={{ ...MO.emerge, delay: 0.2 }}
                  style={{
                    fontSize: '10px',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    letterSpacing: '0.12em',
                    marginTop: 12,
                    fontStyle: 'italic',
                  }}
                >
                  {t('instruments.placeScan.alignedHint', 'Le lieu répond à ta position.')}
                </motion.span>
              )}
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'reading' && heading != null && directionDeg != null && (
            <motion.span
              key="dir-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.08 }}
              exit={{ opacity: 0 }}
              transition={{ ...MO.slow, delay: 3 }}
              style={{
                fontSize: '8px',
                letterSpacing: '0.2em',
                fontFamily: '"Inter", system-ui, sans-serif',
                marginTop: 20,
              }}
            >
              {(() => {
                const rel = ((directionDeg - heading) % 360 + 360) % 360;
                if (rel < 23 || rel > 337) return '\u2248 devant';
                if (rel < 68) return '\u2248 NE';
                if (rel < 113) return '\u2248 E';
                if (rel < 158) return '\u2248 SE';
                if (rel < 203) return '\u2248 derrière';
                if (rel < 248) return '\u2248 SO';
                if (rel < 293) return '\u2248 O';
                return '\u2248 NO';
              })()}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        key={phase}
        initial={{ opacity: 0 }}
        animate={{
          opacity: phase === 'idle' ? 0.04 : phase === 'listening' ? 0.08 : 0.12,
        }}
        transition={MO.gentle}
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          fontSize: '7px',
          fontFamily: '"Inter", system-ui, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          color: C.ink,
          pointerEvents: 'none',
          zIndex: 30,
        }}
      >
        {phase === 'idle' ? 'VEILLE' : phase === 'listening' ? 'LECTURE' : 'RÉSONANCE'}
      </motion.div>
    </div>
  );
}
