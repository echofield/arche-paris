import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import {
  MONTMARTRE_SYMBOLS, TreasureSymbol,
  RIDDLE_TIME, COOLDOWN_TIME, GPS_RADIUS_METERS,
} from '../data/treasure-symbols';

// ============================================================
// TRÉSOR CACHÉ — Hunt Instrument
//
// Same family as Méridiens / Mon Paris / Aura.
// Not a dashboard. Not gamified. An instrument for finding.
//
// States:  VEILLE → ÉNIGME → QUÊTE → SCEAU → GARDIEN
// Signals: Riddle (reading) · Clue (direction) · Seal (recognition)
//
// Progress layers (non-gamified):
//   1. Ambient particle field — density grows with collection
//   2. Murmur line — qualitative phrase shifts with depth
//   3. Memory echoes — sealed symbols' lines drift through veille
//   4. Paper warmth — background temp shifts subtly
//
// Dependencies:
//   npm install motion lucide-react
//   (React 18+ assumed)
//
// Usage:
//   <TresorCache onExit={() => navigate('/')} />
// ============================================================

interface TresorCacheProps {
  onExit: () => void;
}

// --- TOKENS ---
const C = {
  paper: '#FAF9F6',
  ink: '#003D2C',
  gold: '#A38767',
};

// --- PAPER WARMTH (shifts from cool to warm with progress) ---
const PAPER_PALETTE = [
  '#FAF9F6', // 0 — cool paper
  '#FAF8F3', // 1 — barely warmer
  '#F9F6EE', // 2 — parchment hint
  '#F8F4E9', // 3 — aged paper
  '#F6F1E3', // 4 — warm parchment (gardien)
];

// --- MURMUR LINES (qualitative progress, not numbers) ---
const MURMUR_LINES = [
  'La colline est lointaine.',
  'La colline murmure.',
  'La colline écoute.',
  'La colline se souvient.',
  'La colline te connaît.',
];

// --- MOTION ---
const MO = {
  measured: { duration: 0.8, ease: [0.4, 0, 0.2, 1] as const },
  gentle:  { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] as const },
  slow:    { duration: 2.0, ease: [0.4, 0, 0.2, 1] as const },
  reveal:  { duration: 2.5, ease: [0.25, 0.1, 0.25, 1] as const },
};

// --- COLLECTION PERSISTENCE ---
const COLLECTION_KEY = 'arche_tresor_collection_v1';

function loadCollection(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveCollection(ids: Set<string>) {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify([...ids]));
}

// --- DISTANCE (Haversine) ---
function distanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- PHASES ---
type Phase =
  | 'veille'
  | 'enigme'
  | 'quete'
  | 'preuve'
  | 'sceau'
  | 'gardien';

function getZoneLabel(phase: Phase): string {
  switch (phase) {
    case 'veille':  return 'DISPERSION';
    case 'enigme':  return 'INTERFÉRENCE';
    case 'quete':
    case 'preuve':  return 'RÉSONANCE';
    case 'sceau':   return 'AXE';
    case 'gardien': return 'GARDIEN';
  }
}

// ============================================================
// AMBIENT PARTICLE FIELD (from Aura grammar)
// Density increases with collection progress
// ============================================================
function AmbientField({ progress }: { progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef(0);
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    size: number; opacity: number; drift: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Particle count scales with progress: 8 at 0, 40 at 4
    const count = Math.floor(8 + progress * 8);
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1 - 0.05,
      size: 0.6 + Math.random() * (0.9 + progress * 0.35),
      opacity: 0.03 + Math.random() * 0.06 + progress * 0.015,
      drift: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particlesRef.current) {
        p.drift += 0.003;
        p.x += p.vx + Math.sin(p.drift) * 0.08;
        p.y += p.vy + Math.cos(p.drift * 0.7) * 0.04;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 61, 44, ${p.opacity})`;
        ctx.fill();
      }
      frameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 2,
      }}
    />
  );
}

// ============================================================
// MEMORY ECHOES — sealed symbols' lines drift through veille
// ============================================================
function MemoryEchoes({ collected }: { collected: Set<string> }) {
  const [currentEcho, setCurrentEcho] = useState(0);

  const sealedSymbols = useMemo(
    () => MONTMARTRE_SYMBOLS.filter(s => collected.has(s.id)),
    [collected],
  );

  useEffect(() => {
    if (sealedSymbols.length === 0) return;
    const interval = setInterval(() => {
      setCurrentEcho(prev => (prev + 1) % sealedSymbols.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [sealedSymbols.length]);

  if (sealedSymbols.length === 0) return null;
  const sym = sealedSymbols[currentEcho];
  if (!sym) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sym.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.11, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: 'absolute',
          bottom: '16%', left: 0, right: 0,
          textAlign: 'center', pointerEvents: 'none', zIndex: 8,
          padding: '0 36px',
        }}
      >
        <p style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '11px', fontStyle: 'italic', lineHeight: 1.6,
          margin: 0, color: C.ink,
        }}>
          {sym.poeticLine}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// SIGNAL TRACE — ambient canvas (phosphor family)
// ============================================================
function HuntSignal({ phase, intensity }: { phase: Phase; intensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef(0);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 66;
    const H = window.innerHeight * 0.32;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const render = () => {
      tRef.current += 0.016;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      const centerX = W / 2;
      const amplitude = W * 0.35 * Math.pow(1 - intensity, 1.5);
      const jitter = (1 - intensity) * 2.5;
      const speed  = 1.5 + (1 - intensity) * 3;
      const lineOp = 0.15 + intensity * 0.55;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(0, 61, 44, ${lineOp})`;
      ctx.lineWidth   = 0.5 + intensity * 1;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';

      for (let i = 0; i <= H; i += 2) {
        const ny = i / H;
        const w1 = Math.sin(ny * Math.PI * 6 + t * speed) * amplitude;
        const w2 = Math.sin(ny * Math.PI * 2.3 + t * speed * 0.6) * amplitude * 0.3;
        const micro = (Math.random() - 0.5) * jitter;
        const px = centerX + w1 + w2 + micro;
        if (i === 0) ctx.moveTo(px, i);
        else ctx.lineTo(px, i);
      }
      ctx.stroke();

      if (intensity > 0.8) {
        const nOp = (intensity - 0.8) / 0.2;
        ctx.fillStyle = `rgba(0, 61, 44, ${nOp * 0.5})`;
        ctx.beginPath();
        ctx.arc(centerX, H / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, [intensity]);

  const isActive = phase !== 'veille' && phase !== 'gardien';

  return (
    <motion.canvas
      ref={canvasRef}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={MO.gentle}
      style={{
        position: 'absolute',
        right: 18, top: '34%',
        pointerEvents: 'none', zIndex: 5,
      }}
    />
  );
}

// ============================================================
// SEAL MARKS — 4 dots
// ============================================================
function SealRow({ collected, total }: { collected: Set<string>; total: TreasureSymbol[] }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {total.map((sym) => {
        const sealed = collected.has(sym.id);
        return (
          <motion.div
            key={sym.id}
            animate={{ opacity: sealed ? 0.5 : 0.1, scale: sealed ? 1 : 0.8 }}
            transition={MO.measured}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: sealed ? C.ink : 'transparent',
              border: `0.5px solid rgba(0, 61, 44, ${sealed ? 0.6 : 0.15})`,
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// SHARED STYLES (mobile-first)
// ============================================================
const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '0.5px solid rgba(0, 61, 44, 0.2)',
  fontFamily: '"Inter", system-ui, sans-serif',
  fontSize: '16px', // prevents iOS auto-zoom
  textAlign: 'center',
  color: C.ink,
  outline: 'none',
  padding: '10px 12px',
  width: '75vw',
  maxWidth: 260,
  letterSpacing: '0.07em',
  WebkitAppearance: 'none' as const,
  borderRadius: 0,
};

const btnSmall: React.CSSProperties = {
  background: 'transparent',
  border: '0.5px solid rgba(0, 61, 44, 0.12)',
  fontFamily: '"Inter", system-ui, sans-serif',
  fontSize: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  padding: '12px 32px',
  cursor: 'pointer',
  color: C.ink,
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
};

const serifBody: React.CSSProperties = {
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontStyle: 'italic',
  lineHeight: 1.7,
  margin: 0,
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export function TresorCache({ onExit }: TresorCacheProps) {
  const [phase, setPhase]             = useState<Phase>('veille');
  const [collected, setCollected]     = useState<Set<string>>(loadCollection);
  const [answer, setAnswer]           = useState('');
  const [riddleTimer, setRiddleTimer] = useState(RIDDLE_TIME);
  const [cooldown, setCooldown]       = useState(0);
  const [error, setError]             = useState('');
  const [gpsStatus, setGpsStatus]     = useState<'idle' | 'checking' | 'success' | 'fail'>('idle');

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- DERIVED ---
  const currentSymbol = MONTMARTRE_SYMBOLS.find(s => !collected.has(s.id)) || null;
  const allCollected  = MONTMARTRE_SYMBOLS.every(s => collected.has(s.id));
  const progress      = collected.size; // 0–4
  const paperColor    = PAPER_PALETTE[Math.min(progress, PAPER_PALETTE.length - 1)];
  const murmurLine    = MURMUR_LINES[Math.min(progress, MURMUR_LINES.length - 1)];

  // All collected → gardien
  useEffect(() => {
    if (allCollected && phase !== 'gardien') setPhase('gardien');
  }, [allCollected, phase]);

  // --- SIGNAL INTENSITY ---
  const intensity =
    phase === 'veille'  ? 0.1
    : phase === 'enigme'  ? 0.3 + (1 - riddleTimer / RIDDLE_TIME) * 0.3
    : phase === 'quete'   ? 0.7
    : phase === 'preuve'  ? 0.8
    : phase === 'sceau'   ? 1
    : 0;

  // --- CLEAR TIMERS ---
  const clearTimers = useCallback(() => {
    if (timerRef.current)    { clearInterval(timerRef.current);    timerRef.current = null; }
    if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // --- COOLDOWN HELPER ---
  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_TIME);
    cooldownRef.current = setInterval(() => {
      setCooldown(p => {
        if (p <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }, []);

  // --- START RIDDLE ---
  const startRiddle = useCallback(() => {
    if (cooldown > 0 || !currentSymbol) return;
    clearTimers();
    setPhase('enigme');
    setAnswer('');
    setError('');
    setRiddleTimer(RIDDLE_TIME);

    timerRef.current = setInterval(() => {
      setRiddleTimer(prev => {
        if (prev <= 1) {
          clearTimers();
          setPhase('veille');
          setError('Le temps s\'est écoulé.');
          startCooldown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cooldown, currentSymbol, clearTimers, startCooldown]);

  // --- SUBMIT RIDDLE ---
  const submitRiddle = useCallback(() => {
    if (!currentSymbol) return;
    const normalized = answer.trim().toLowerCase();
    if (normalized === currentSymbol.riddleAnswer) {
      clearTimers();
      setPhase('quete');
      setError('');
      setAnswer('');
    } else {
      clearTimers();
      setPhase('veille');
      setError('Réponse incorrecte.');
      setAnswer('');
      startCooldown();
    }
  }, [answer, currentSymbol, clearTimers, startCooldown]);

  // --- SEAL ---
  const sealSymbol = useCallback(() => {
    if (!currentSymbol) return;
    setCollected(prev => {
      const next = new Set(prev);
      next.add(currentSymbol.id);
      saveCollection(next);
      return next;
    });
    setPhase('sceau');
    setAnswer('');
    setError('');
    setGpsStatus('idle');
    clearTimers();

    setTimeout(() => {
      const remaining = MONTMARTRE_SYMBOLS.filter(
        s => !collected.has(s.id) && s.id !== currentSymbol.id,
      );
      setPhase(remaining.length === 0 ? 'gardien' : 'veille');
    }, 6000);
  }, [currentSymbol, collected, clearTimers]);

  // --- GPS VERIFICATION ---
  const tryGps = useCallback(() => {
    if (!currentSymbol) return;
    setGpsStatus('checking');
    if (!navigator.geolocation) {
      setGpsStatus('fail');
      setPhase('preuve');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distanceMeters(
          pos.coords.latitude, pos.coords.longitude,
          currentSymbol.coordinates.lat, currentSymbol.coordinates.lng,
        );
        if (d <= GPS_RADIUS_METERS) {
          setGpsStatus('success');
          sealSymbol();
        } else {
          setGpsStatus('fail');
          setPhase('preuve');
        }
      },
      () => {
        setGpsStatus('fail');
        setPhase('preuve');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [currentSymbol, sealSymbol]);

  // --- SUBMIT PROOF ---
  const submitProof = useCallback(() => {
    if (!currentSymbol) return;
    const normalized = answer.trim().toLowerCase();
    if (currentSymbol.proofAnswers.includes(normalized)) {
      sealSymbol();
    } else {
      setError('Ce n\'est pas ce que le lieu montre.');
      setAnswer('');
    }
  }, [answer, currentSymbol, sealSymbol]);

  // --- ZONE LABEL ---
  const zoneLabel = getZoneLabel(phase);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        overflow: 'hidden',
        backgroundColor: paperColor,
        transition: 'background-color 2s ease',
        color: C.ink,
        fontFamily: '"Inter", system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        WebkitOverflowScrolling: 'touch' as any,
        overscrollBehavior: 'none',
      }}
    >
      {/* NOISE TEXTURE */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* AMBIENT PARTICLE FIELD */}
      <AmbientField progress={progress} />

      {/* SIGNAL TRACE */}
      <HuntSignal phase={phase} intensity={intensity} />

      {/* MEMORY ECHOES */}
      {phase === 'veille' && <MemoryEchoes collected={collected} />}

      {/* ─── NAV ─── */}
      <nav style={{
        position: 'relative', zIndex: 50,
        padding: '20px 20px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button
          onClick={onExit}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: '9px', textTransform: 'uppercase',
            letterSpacing: '0.2em', opacity: 0.4,
            border: 'none', background: 'transparent',
            cursor: 'pointer', color: C.ink,
            fontFamily: '"Inter", system-ui, sans-serif',
            padding: '14px 10px 14px 0',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          <ArrowLeft size={13} strokeWidth={1.2} />
          <span>Retour</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <SealRow collected={collected} total={MONTMARTRE_SYMBOLS} />
          <span style={{
            fontSize: '8px', textTransform: 'uppercase',
            letterSpacing: '0.28em', opacity: 0.25,
          }}>
            Trésor
          </span>
        </div>
      </nav>

      {/* ─── CONTENT AREA ─── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 28px', position: 'relative', zIndex: 10,
      }}>
        <AnimatePresence mode="wait">

          {/* ── GARDIEN ── */}
          {phase === 'gardien' && (
            <motion.div
              key="gardien"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MO.reveal}
              style={{
                textAlign: 'center',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 22,
              }}
            >
              <span style={{
                fontSize: '7px', textTransform: 'uppercase',
                letterSpacing: '0.34em', opacity: 0.25,
              }}>
                Montmartre
              </span>

              <span style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '22px', fontWeight: 300, letterSpacing: '0.06em',
              }}>
                Gardien
              </span>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.34, y: 0 }}
                transition={{ ...MO.reveal, delay: 1.5 }}
                style={{
                  ...serifBody,
                  fontSize: '13px',
                  maxWidth: 280, textAlign: 'center',
                }}
              >
                Quatre symboles reconnus.
                <br />La colline te connaît maintenant.
              </motion.p>

              <SealRow collected={collected} total={MONTMARTRE_SYMBOLS} />
            </motion.div>
          )}

          {/* ── SCEAU ── */}
          {phase === 'sceau' && currentSymbol && (
            <motion.div
              key="sceau"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MO.reveal}
              style={{
                textAlign: 'center',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 18,
              }}
            >
              {/* Seal ring */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.6 }}
                transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  width: 46, height: 46, borderRadius: '50%',
                  border: `1px solid ${C.ink}`, opacity: 0.42,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  backgroundColor: C.ink,
                }} />
              </motion.div>

              <span style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '15px', fontWeight: 300, letterSpacing: '0.06em',
              }}>
                {currentSymbol.name}
              </span>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.34, y: 0 }}
                transition={{ ...MO.reveal, delay: 1.2 }}
                style={{
                  ...serifBody,
                  fontSize: '12px',
                  maxWidth: 260,
                }}
              >
                {currentSymbol.poeticLine}
              </motion.p>

              {currentSymbol.atmosphere && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.18 }}
                  transition={{ ...MO.slow, delay: 2.5 }}
                  style={{
                    fontSize: '9px', fontStyle: 'italic',
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    maxWidth: 240, textAlign: 'center',
                  }}
                >
                  {currentSymbol.atmosphere}
                </motion.span>
              )}

              {currentSymbol.ghostQuote && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.17 }}
                  transition={{ duration: 2, delay: 3.5 }}
                  style={{ marginTop: 14, textAlign: 'right', maxWidth: 240 }}
                >
                  <p style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: '9px', fontStyle: 'italic',
                    margin: 0, lineHeight: 1.5,
                  }}>
                    «&thinsp;{currentSymbol.ghostQuote}&thinsp;»
                  </p>
                  <span style={{
                    fontFamily: '"Inter", system-ui, sans-serif',
                    fontSize: '6px',
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    display: 'block', marginTop: 4,
                  }}>
                    {currentSymbol.ghostAuthor}
                  </span>
                </motion.div>
              )}

              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.21 }}
                transition={{ duration: 1.5, delay: 1 }}
                style={{
                  fontSize: '7px', textTransform: 'uppercase',
                  letterSpacing: '0.24em', marginTop: 10,
                }}
              >
                Le lieu reconnaît.
              </motion.span>
            </motion.div>
          )}

          {/* ── PREUVE ── */}
          {phase === 'preuve' && currentSymbol && (
            <motion.div
              key="preuve"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MO.gentle}
              style={{
                textAlign: 'center',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 18,
              }}
            >
              <span style={{
                fontSize: '7px', textTransform: 'uppercase',
                letterSpacing: '0.28em', opacity: 0.25,
              }}>
                Preuve requise
              </span>

              <p style={{
                ...serifBody,
                fontSize: '13px',
                maxWidth: 280, opacity: 0.5,
              }}>
                {currentSymbol.proofQuestion}
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 14, marginTop: 8,
              }}>
                <input
                  type="text"
                  value={answer}
                  onChange={e => { setAnswer(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && submitProof()}
                  placeholder="…"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  style={inputStyle}
                />
                <button
                  onClick={submitProof}
                  disabled={!answer.trim()}
                  style={{
                    ...btnSmall,
                    opacity: answer.trim() ? 0.42 : 0.12,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  Confirmer
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.34 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontSize: '9px', fontStyle: 'italic',
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                    }}
                  >
                    {error}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── QUÊTE ── */}
          {phase === 'quete' && currentSymbol && (
            <motion.div
              key="quete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MO.gentle}
              style={{
                textAlign: 'center',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 22,
              }}
            >
              <span style={{
                fontSize: '7px', textTransform: 'uppercase',
                letterSpacing: '0.28em', opacity: 0.25,
              }}>
                {currentSymbol.name}
              </span>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.47, y: 0 }}
                transition={{ ...MO.reveal, delay: 0.5 }}
                style={{
                  ...serifBody,
                  fontSize: '14px',
                  maxWidth: 300,
                }}
              >
                {currentSymbol.clue}
              </motion.p>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.42 }}
                transition={{ ...MO.slow, delay: 1.5 }}
                onClick={tryGps}
                disabled={gpsStatus === 'checking'}
                style={{
                  ...btnSmall,
                  fontSize: '9px',
                  padding: '14px 32px',
                  marginTop: 8,
                  opacity: gpsStatus === 'checking' ? 0.21 : 0.42,
                }}
              >
                {gpsStatus === 'checking' ? 'Lecture…' : 'Je l\'ai trouvé'}
              </motion.button>
            </motion.div>
          )}

          {/* ── ÉNIGME ── */}
          {phase === 'enigme' && currentSymbol && (
            <motion.div
              key="enigme"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MO.measured}
              style={{
                textAlign: 'center',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 18,
              }}
            >
              {/* Timer */}
              <span style={{
                fontSize: '19px',
                fontFamily: '"Inter", system-ui, sans-serif',
                fontVariantNumeric: 'tabular-nums',
                opacity: riddleTimer <= 10 ? 0.6 : 0.25,
                letterSpacing: '0.14em',
                transition: 'opacity 0.3s ease',
              }}>
                {riddleTimer}
              </span>

              <p style={{
                ...serifBody,
                fontSize: '14px',
                maxWidth: 300, opacity: 0.5,
                padding: '0 4px',
              }}>
                {currentSymbol.riddle}
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 14, marginTop: 8,
              }}>
                <input
                  type="text"
                  value={answer}
                  onChange={e => { setAnswer(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && submitRiddle()}
                  placeholder="…"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  style={inputStyle}
                />
                <button
                  onClick={submitRiddle}
                  disabled={!answer.trim()}
                  style={{
                    ...btnSmall,
                    opacity: answer.trim() ? 0.42 : 0.12,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  Répondre
                </button>
              </div>
            </motion.div>
          )}

          {/* ── VEILLE ── */}
          {phase === 'veille' && currentSymbol && (
            <motion.div
              key="veille"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MO.gentle}
              style={{
                textAlign: 'center',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 18,
              }}
            >
              <span style={{
                fontSize: '7px', textTransform: 'uppercase',
                letterSpacing: '0.34em', opacity: 0.21,
              }}>
                Montmartre · Symbole {MONTMARTRE_SYMBOLS.indexOf(currentSymbol) + 1}
              </span>

              <span style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '20px', fontWeight: 300, letterSpacing: '0.06em',
              }}>
                {currentSymbol.name}
              </span>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ ...MO.slow, delay: 0.8 }}
                style={{
                  ...serifBody,
                  fontSize: '12px',
                  maxWidth: 260,
                }}
              >
                Résous l'énigme pour révéler l'indice.
              </motion.p>

              {cooldown > 0 ? (
                <span style={{
                  fontSize: '9px', opacity: 0.21,
                  letterSpacing: '0.12em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {cooldown}s
                </span>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.38 }}
                  transition={{ ...MO.slow, delay: 1.2 }}
                  onClick={startRiddle}
                  style={{
                    ...btnSmall,
                    marginTop: 4,
                  }}
                >
                  Commencer
                </motion.button>
              )}

              <AnimatePresence>
                {error && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    transition={MO.measured}
                    style={{
                      fontSize: '9px', fontStyle: 'italic',
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                    }}
                  >
                    {error}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ─── BOTTOM LAYER ─── */}

      {/* Murmur line */}
      <motion.div
        key={murmurLine}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.14 }}
        transition={{ duration: 3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: 'absolute',
          bottom: 54, left: 0, right: 0,
          textAlign: 'center', pointerEvents: 'none', zIndex: 25,
          padding: '0 24px',
        }}
      >
        <span style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '9px', fontStyle: 'italic',
          letterSpacing: '0.1em', color: C.ink,
        }}>
          {murmurLine}
        </span>
      </motion.div>

      {/* Zone label */}
      <motion.div
        key={zoneLabel}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'veille' ? 0.07 : 0.25 }}
        transition={MO.gentle}
        style={{
          position: 'absolute', bottom: 24, left: 24,
          fontSize: '7px',
          fontFamily: '"Inter", system-ui, sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.28em',
          color: C.ink, pointerEvents: 'none', zIndex: 30,
        }}
      >
        {zoneLabel}
      </motion.div>

      {/* Count (very faint) */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        fontSize: '7px',
        fontFamily: '"Inter", system-ui, sans-serif',
        letterSpacing: '0.18em', opacity: 0.07,
        fontVariantNumeric: 'tabular-nums',
        color: C.ink, pointerEvents: 'none', zIndex: 30,
      }}>
        {collected.size}/{MONTMARTRE_SYMBOLS.length}
      </div>
    </div>
  );
}
