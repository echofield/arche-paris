import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe, Sparkles } from 'lucide-react';

interface ArcheInterfaceProps {
  onBack: () => void;
  cardId?: string | null;
  onOpenKept?: () => void;
  onEnterChamp?: () => void;
}

type LensType = 'NEUTRAL' | 'CLARTE' | 'ANCRAGE' | 'ECHO' | 'MOUVEMENT' | 'ALIGNEMENT' | 'OMBRE';

const MOCK_DATA: Record<LensType, { current: number; previous: number; phase: string; label: string; unit?: string }> = {
  NEUTRAL: { current: 0, previous: 0, phase: '—', label: 'VEILLE' },
  CLARTE: { current: 0.284, previous: 0.210, phase: 'I', label: 'DENSITÉ OPTIQUE' },
  ANCRAGE: { current: 0.852, previous: 0.820, phase: 'IV', label: 'RAYON ACTIF', unit: 'm' },
  ECHO: { current: 0.421, previous: 0.450, phase: 'II', label: 'RÉSONANCE' },
  MOUVEMENT: { current: 0.153, previous: 0.110, phase: 'I', label: 'VÉLOCITÉ' },
  ALIGNEMENT: { current: 0.605, previous: 0.600, phase: 'III', label: 'COHÉRENCE' },
  OMBRE: { current: 0.128, previous: 0.080, phase: 'I', label: 'TENSION' }
};

const LENS_CONFIG: Record<LensType, { label: string; sentence: string; unlockText?: string }> = {
  NEUTRAL: { label: 'Neutre', sentence: "La présence reste discrète." },
  CLARTE: { label: 'Clarté', sentence: "Le regard perce la brume." },
  ANCRAGE: { label: 'Ancrage', sentence: "Ici, le temps s'arrête.", unlockText: "Un lieu de silence s'est révélé." },
  ECHO: { label: 'Écho', sentence: "La ville se souvient de vous." },
  MOUVEMENT: { label: 'Mouvement', sentence: "L'horizon recule." },
  ALIGNEMENT: { label: 'Alignement', sentence: "Une direction se dessine." },
  OMBRE: { label: 'Ombre', sentence: "Une densité invisible pèse." }
};

const LENS_KEYS: LensType[] = ['CLARTE', 'ANCRAGE', 'ECHO', 'MOUVEMENT', 'ALIGNEMENT', 'OMBRE'];

function LiveReading({ base, previous, label, unit = '' }: { base: number; previous: number; label: string; unit?: string }) {
  const [displayValue, setDisplayValue] = useState(base);

  useEffect(() => {
    const interval = setInterval(() => {
      const drift = (Math.random() - 0.5) * 0.01;
      setDisplayValue(() => Number((base + drift).toFixed(3)));
    }, 800);
    return () => clearInterval(interval);
  }, [base]);

  const formatted = unit === 'm' ? (displayValue * 500).toFixed(1) : displayValue.toFixed(3);
  const isUp = displayValue > previous;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'monospace', fontSize: 10, color: '#003D2C', opacity: 0.6 }}>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 8, opacity: 0.5, marginBottom: 2 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{formatted} {unit}</span>
        {base > 0 && <span style={{ fontSize: 8, opacity: 0.4 }}>{isUp ? '↑' : '↓'}</span>}
      </div>
    </div>
  );
}

function WaveformReading({ lens, current, previous }: { lens: LensType; current: number; previous: number }) {
  const activePathRef = useRef<SVGPathElement>(null);
  const ghostPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.01;
      if (!activePathRef.current || !ghostPathRef.current) return;

      const width = 300;
      const height = 80;
      const centerY = height / 2;
      const pointsActive: [number, number][] = [];
      const pointsGhost: [number, number][] = [];

      let freq = 0.05;
      let speed = 1;
      const ampActive = 2 + current * 30;
      const ampGhost = 2 + previous * 30;

      switch (lens) {
        case 'CLARTE': freq = 0.05; speed = 2; break;
        case 'ANCRAGE': freq = 0.02; speed = 0.5; break;
        case 'MOUVEMENT': freq = 0.03; speed = 3; break;
        case 'ECHO': freq = 0.08; speed = 1.5; break;
        case 'ALIGNEMENT': freq = 0.04; speed = 1; break;
        case 'OMBRE': freq = 0.1; speed = 0.8; break;
        default: freq = 0.01; speed = 1;
      }

      for (let x = 0; x <= width; x += 2) {
        const sine = Math.sin(x * freq + time * speed);
        const breath = 1 + Math.sin(time * 2) * 0.05;
        let yActive = centerY + sine * ampActive * breath;
        let yGhost = centerY + sine * ampGhost;
        const distFromCenter = Math.abs(x - width / 2);
        const edgeMask = Math.max(0, 1 - Math.pow(distFromCenter / (width / 2), 3));
        yActive = centerY + (yActive - centerY) * edgeMask;
        yGhost = centerY + (yGhost - centerY) * edgeMask;
        pointsActive.push([x, yActive]);
        pointsGhost.push([x, yGhost]);
      }

      const dActive = `M ${pointsActive[0][0]} ${pointsActive[0][1]} ` + pointsActive.map((p) => `L ${p[0]} ${p[1]}`).join(' ');
      const dGhost = `M ${pointsGhost[0][0]} ${pointsGhost[0][1]} ` + pointsGhost.map((p) => `L ${p[0]} ${p[1]}`).join(' ');

      activePathRef.current.setAttribute('d', dActive);
      ghostPathRef.current.setAttribute('d', dGhost);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [lens, current, previous]);

  return (
    <div style={{ position: 'relative', width: 300, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="300" height="80" style={{ overflow: 'visible', position: 'absolute', zIndex: 10 }}>
        <path ref={ghostPathRef} fill="none" stroke="#003D2C" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="4 4" strokeLinecap="round" />
        <path ref={activePathRef} fill="none" stroke="#003D2C" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function ArcheInterface({ onBack }: ArcheInterfaceProps) {
  const [activeLens, setActiveLens] = useState<LensType>('NEUTRAL');
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [visibleSentence, setVisibleSentence] = useState(LENS_CONFIG.NEUTRAL.sentence);

  const data = MOCK_DATA[activeLens];
  const isQuestUnlocked = data.current >= 0.8;

  useEffect(() => {
    const timer = setTimeout(() => setVisibleSentence(LENS_CONFIG[activeLens].sentence), 250);
    return () => clearTimeout(timer);
  }, [activeLens]);

  const isClarte = activeLens === 'CLARTE';
  const isAncrage = activeLens === 'ANCRAGE';
  const isMouvement = activeLens === 'MOUVEMENT';
  const isAlignement = activeLens === 'ALIGNEMENT';
  const isOmbre = activeLens === 'OMBRE';
  const isNeutral = activeLens === 'NEUTRAL';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#FAF8F2',
      color: '#003D2C',
      fontFamily: 'var(--font-serif, Georgia, serif)',
    }}>
      {/* Vignette */}
      <motion.div
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, mixBlendMode: 'multiply' }}
        animate={{ boxShadow: isOmbre ? 'inset 0 0 150px rgba(0,0,0,0.15)' : 'inset 0 0 0px rgba(0,0,0,0)' }}
        transition={{ duration: 1 }}
      />

      {/* Noise */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: isClarte ? 0.02 : 0.06,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Nav */}
      <nav style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: 0.6,
            background: 'none',
            border: 'none',
            color: '#003D2C',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
          }}
        >
          <ArrowLeft size={12} strokeWidth={1} />
          <span>Retour</span>
        </button>
        <button
          onClick={() => setLang((l) => (l === 'FR' ? 'EN' : 'FR'))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: 0.4,
            background: 'none',
            border: 'none',
            color: '#003D2C',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
          }}
        >
          <Globe size={10} strokeWidth={1} />
          <span>{lang}</span>
        </button>
      </nav>

      {/* Visualization */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        {/* Background Field */}
        <motion.div
          style={{ position: 'absolute' }}
          animate={{ scale: isMouvement ? 1.5 : 1, opacity: isClarte ? 0.3 : 0.5 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        >
          <div style={{ width: 600, height: 600, borderRadius: '50%', border: '1px solid #003D2C', opacity: 0.03 }} />
        </motion.div>

        {/* Membrane */}
        <motion.div
          style={{ position: 'absolute', backgroundColor: '#003D2C' }}
          animate={{
            width: isAlignement ? 320 : 260,
            height: isAlignement ? 180 : 260,
            scale: isMouvement ? 1.2 : 1,
            x: isOmbre ? -20 : 0,
            opacity: isClarte ? 0.08 : 0.04,
            filter: isClarte ? 'blur(0px)' : 'blur(40px)',
            borderRadius: isAncrage ? '50%' : isOmbre ? '40% 60% 70% 30% / 40% 50% 60% 50%' : '50%',
          }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Rings */}
        <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            style={{ position: 'absolute', borderRadius: '50%', border: '1px solid #003D2C' }}
            animate={{
              width: isMouvement ? 300 : 200,
              height: isMouvement ? 300 : 200,
              opacity: isClarte ? 0.4 : 0.1,
            }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
          <motion.div
            style={{ position: 'absolute', width: 200, height: 200 }}
            animate={{ width: isMouvement ? 300 : 200, height: isMouvement ? 300 : 200, rotate: 360 }}
            transition={{ rotate: { duration: isAncrage ? 120 : 40, repeat: Infinity, ease: 'linear' }, width: { duration: 1.5 }, height: { duration: 1.5 } }}
          >
            <motion.div
              style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%) translateY(-2px)', width: 4, height: 4, backgroundColor: '#003D2C', borderRadius: '50%' }}
              animate={{ opacity: isAncrage ? 0.8 : 0.5 }}
            />
          </motion.div>
          {isAlignement && (
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ position: 'absolute', width: 400, height: 1, backgroundColor: '#003D2C', opacity: 0.1 }} />
          )}
        </div>

        {/* Center Dot */}
        <motion.div
          style={{ position: 'relative', zIndex: 20, width: 6, height: 6, backgroundColor: '#003D2C', borderRadius: '50%' }}
          animate={{ scale: isAncrage ? 1 : [1, 1.2, 1] }}
          transition={{ duration: isAncrage ? 0 : 2, repeat: Infinity }}
        >
          {!isAncrage && (
            <motion.div
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid #003D2C' }}
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      {/* Data & Text */}
      <div style={{
        position: 'absolute',
        bottom: 140,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 40,
        pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {!isNeutral && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 80 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: 16, position: 'relative', width: 300, display: 'flex', justifyContent: 'center' }}
            >
              <WaveformReading lens={activeLens} current={data.current} previous={data.previous} />
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ position: 'absolute', right: -50, top: '50%', transform: 'translateY(-50%)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 8, opacity: 0.5, color: '#003D2C', marginBottom: 2 }}>Cycle</span>
                    <span style={{ fontSize: 10, letterSpacing: '0.15em', fontStyle: 'italic', color: '#003D2C', opacity: 0.8 }}>{data.phase}</span>
                  </div>
                  <LiveReading base={data.current} previous={data.previous} label={data.label} unit={data.unit} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={visibleSentence}
            initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
            animate={{ opacity: 0.9, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -5, filter: 'blur(4px)' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              fontSize: 20,
              letterSpacing: '0.02em',
              color: '#003D2C',
              fontStyle: 'italic',
              fontWeight: 300,
              textAlign: 'center',
              padding: '0 16px',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            {visibleSentence}
          </motion.p>
        </AnimatePresence>

        {isQuestUnlocked && LENS_CONFIG[activeLens].unlockText && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              pointerEvents: 'auto',
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 16px',
              border: '1px solid rgba(0,61,44,0.2)',
              backgroundColor: '#FAF8F2',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={12} style={{ color: '#003D2C', opacity: 0.6 }} />
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#003D2C' }}>
              {LENS_CONFIG[activeLens].unlockText}
            </span>
          </motion.button>
        )}
      </div>

      {/* Lens Selector */}
      <div style={{
        position: 'absolute',
        bottom: 48,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
        zIndex: 30,
        padding: '0 24px',
      }}>
        {LENS_KEYS.map((lensKey) => {
          const isActive = activeLens === lensKey;
          const lensData = MOCK_DATA[lensKey];
          const hasActivity = lensData.current > 0;

          return (
            <button
              key={lensKey}
              onClick={() => setActiveLens(isActive ? 'NEUTRAL' : lensKey)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  marginBottom: 12,
                  width: 1,
                  background: 'linear-gradient(to top, #003D2C, transparent)',
                  opacity: 0.3,
                }}
                initial={{ height: 0 }}
                animate={{ height: isActive ? 60 : 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-sans, Inter, sans-serif)',
                  color: '#003D2C',
                  opacity: isActive ? 0.95 : 0.4,
                  fontWeight: isActive ? 500 : 300,
                  letterSpacing: isActive ? '0.05em' : '0.25em',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.5s ease-out',
                }}
              >
                {LENS_CONFIG[lensKey].label}
              </span>
              {hasActivity && !isActive && (
                <div style={{ width: 2, height: 2, backgroundColor: 'rgba(0,61,44,0.4)', borderRadius: '50%', marginTop: 4 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
