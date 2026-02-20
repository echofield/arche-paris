/**
 * ARCHE — Scientific Instrument Interface
 * Phenomenological visualization with lens-based exploration.
 * Calm, breathing space with animated waveforms and ghost traces.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe, Sparkles } from 'lucide-react';

interface ArcheInterfaceProps {
  onExit: () => void;
}

type LensType = 'NEUTRAL' | 'CLARTE' | 'ANCRAGE' | 'ECHO' | 'MOUVEMENT' | 'ALIGNEMENT' | 'OMBRE';

// --- DATA CONFIGURATION ---

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
  ANCRAGE: {
      label: 'Ancrage',
      sentence: "Ici, le temps s'arrête.",
      unlockText: "Un lieu de silence s'est révélé."
  },
  ECHO: { label: 'Écho', sentence: "La ville se souvient de vous." },
  MOUVEMENT: { label: 'Mouvement', sentence: "L'horizon recule." },
  ALIGNEMENT: { label: 'Alignement', sentence: "Une direction se dessine." },
  OMBRE: { label: 'Ombre', sentence: "Une densité invisible pèse." }
};

// --- THEME COLORS (using project CSS variables) ---
const COLOR_PRIMARY = "var(--green)";  // #003D2C
const COLOR_BG = "var(--paper)";       // #FAF8F2
const COLOR_INK = "var(--ink)";        // #1A1A1A

// Fallback hex values for contexts where CSS vars don't work (inline gradients, etc.)
const HEX_PRIMARY = "#003D2C";
const HEX_BG = "#FAF8F2";

// --- SUB-COMPONENTS ---

function LiveReading({ base, previous, label, unit = '' }: { base: number, previous: number, label: string, unit?: string }) {
    const [displayValue, setDisplayValue] = useState(base);

    useEffect(() => {
        const interval = setInterval(() => {
            const drift = (Math.random() - 0.5) * 0.01;
            setDisplayValue(() => {
                const next = base + drift;
                return Number(next.toFixed(3));
            });
        }, 800);
        return () => clearInterval(interval);
    }, [base]);

    const formatted = unit === 'm'
        ? (displayValue * 500).toFixed(1)
        : displayValue.toFixed(3);

    const isUp = displayValue > previous;

    return (
        <div className="flex flex-col items-end font-mono text-[10px] opacity-60 tabular-nums leading-tight" style={{ color: 'currentColor' }}>
            <span className="uppercase tracking-widest text-[8px] opacity-50 mb-1">{label}</span>
            <div className="flex items-center gap-2">
                <span>{formatted} {unit}</span>
                {base > 0 && (
                    <span className="text-[8px] opacity-40">
                       {isUp ? '↑' : '↓'}
                    </span>
                )}
            </div>
        </div>
    );
}

function WaveformReading({ lens, current, previous }: { lens: LensType, current: number, previous: number }) {
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
      const ampActive = 2 + (current * 30);
      const ampGhost = 2 + (previous * 30);

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
        const sine = Math.sin((x * freq) + (time * speed));
        const breath = 1 + Math.sin(time * 2) * 0.05;

        let yActive = centerY + (sine * ampActive * breath);
        let yGhost = centerY + (sine * ampGhost);

        const distFromCenter = Math.abs(x - width/2);
        const edgeMask = Math.max(0, 1 - Math.pow(distFromCenter / (width/2), 3));

        yActive = centerY + (yActive - centerY) * edgeMask;
        yGhost = centerY + (yGhost - centerY) * edgeMask;

        pointsActive.push([x, yActive]);
        pointsGhost.push([x, yGhost]);
      }

      const dActive = `M ${pointsActive[0][0]} ${pointsActive[0][1]} ` + pointsActive.map(p => `L ${p[0]} ${p[1]}`).join(' ');
      const dGhost = `M ${pointsGhost[0][0]} ${pointsGhost[0][1]} ` + pointsGhost.map(p => `L ${p[0]} ${p[1]}`).join(' ');

      activePathRef.current.setAttribute('d', dActive);
      ghostPathRef.current.setAttribute('d', dGhost);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [lens, current, previous]);

  return (
    <div className="relative w-[300px] h-[80px] flex items-center justify-center">
        <svg width="300" height="80" className="overflow-visible absolute z-10">
            <path
                ref={ghostPathRef}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.15"
                strokeDasharray="4 4"
                strokeLinecap="round"
            />
            <path
                ref={activePathRef}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="drop-shadow-sm"
            />
        </svg>
    </div>
  );
}

// --- MAIN COMPONENT ---

export function ArcheInterface({ onExit }: ArcheInterfaceProps) {
  const [activeLens, setActiveLens] = useState<LensType>('NEUTRAL');
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [visibleSentence, setVisibleSentence] = useState(LENS_CONFIG.NEUTRAL.sentence);

  const data = MOCK_DATA[activeLens];
  const isQuestUnlocked = data.current >= 0.8;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleSentence(LENS_CONFIG[activeLens].sentence);
    }, 250);
    return () => clearTimeout(timer);
  }, [activeLens]);

  const isClarte = activeLens === 'CLARTE';
  const isAncrage = activeLens === 'ANCRAGE';
  const isMouvement = activeLens === 'MOUVEMENT';
  const isAlignement = activeLens === 'ALIGNEMENT';
  const isOmbre = activeLens === 'OMBRE';
  const isNeutral = activeLens === 'NEUTRAL';

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center transition-colors duration-1000"
      style={{
        backgroundColor: HEX_BG,
        color: HEX_PRIMARY
      }}
    >

      {/* VIGNETTE */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-20 mix-blend-multiply"
        animate={{
            boxShadow: isOmbre ? "inset 0 0 150px rgba(0,0,0,0.15)" : "inset 0 0 0px rgba(0,0,0,0)"
        }}
        transition={{ duration: 1 }}
      />

      {/* NOISE TEXTURE */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000"
        style={{
            opacity: isClarte ? 0.02 : 0.06,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
        }}
      />

      {/* NAV */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] opacity-60 hover:opacity-100 transition-opacity"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <ArrowLeft size={12} strokeWidth={1} />
          <span>Retour</span>
        </button>
        <button
          onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] opacity-40 hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <Globe size={10} strokeWidth={1} />
          <span>{lang}</span>
        </button>
      </nav>

      {/* INSTRUMENT VISUALIZATION */}
      <div className="relative flex items-center justify-center z-10 w-full h-full pointer-events-none">

        {/* Background Field */}
        <motion.div
            className="absolute"
            animate={{ scale: isMouvement ? 1.5 : 1, opacity: isClarte ? 0.3 : 0.5 }}
            transition={{ duration: 2, ease: "easeInOut" }}
        >
             <div
               className="w-[600px] h-[600px] rounded-full opacity-[0.03]"
               style={{ border: `1px solid ${HEX_PRIMARY}` }}
             />
        </motion.div>

        {/* Membrane */}
        <motion.div
            className="absolute"
            style={{ backgroundColor: HEX_PRIMARY }}
            animate={{
                width: isAlignement ? 320 : 260,
                height: isAlignement ? 180 : 260,
                scale: isMouvement ? 1.2 : 1,
                x: isOmbre ? -20 : 0,
                opacity: isClarte ? 0.08 : 0.04,
                filter: isClarte ? "blur(0px)" : "blur(40px)",
                borderRadius: isAncrage ? "50%" : isOmbre ? "40% 60% 70% 30% / 40% 50% 60% 50%" : "50%",
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Rings */}
        <div className="absolute flex items-center justify-center">
            <motion.div
                className="absolute rounded-full"
                style={{ border: `1px solid ${HEX_PRIMARY}` }}
                animate={{
                    width: isMouvement ? 300 : 200,
                    height: isMouvement ? 300 : 200,
                    opacity: isClarte ? 0.4 : 0.1,
                    borderColor: isClarte ? HEX_PRIMARY : "transparent",
                    borderWidth: isMouvement ? "1px" : "0.5px"
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            <motion.div
                className="absolute w-[200px] h-[200px]"
                animate={{ width: isMouvement ? 300 : 200, height: isMouvement ? 300 : 200, rotate: 360 }}
                transition={{ rotate: { duration: isAncrage ? 120 : 40, repeat: Infinity, ease: "linear" }, width: { duration: 1.5 }, height: { duration: 1.5 }}}
            >
                <motion.div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[2px] w-[4px] h-[4px] rounded-full"
                    style={{ backgroundColor: HEX_PRIMARY }}
                    animate={{ opacity: isAncrage ? 0.8 : 0.5 }}
                />
            </motion.div>

             {isAlignement && (
                 <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute w-[400px] h-[1px] opacity-10"
                    style={{ backgroundColor: HEX_PRIMARY }}
                 />
             )}
        </div>

        {/* Center Dot */}
        <motion.div
            className="relative z-20 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: HEX_PRIMARY }}
            animate={{ scale: isAncrage ? 1 : [1, 1.2, 1] }}
            transition={{ duration: isAncrage ? 0 : 2, repeat: Infinity }}
        >
            {!isAncrage && (
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `1px solid ${HEX_PRIMARY}` }}
                    animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
        </motion.div>
      </div>

      {/* DATA & TEXT */}
      <div className="absolute bottom-32 w-full flex flex-col items-center justify-end z-40 pointer-events-none">
        <AnimatePresence>
            {!isNeutral && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 80 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4 relative w-[300px] flex justify-center text-current"
                >
                    <WaveformReading lens={activeLens} current={data.current} previous={data.previous} />
                    <motion.div
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="absolute right-[-40px] top-1/2 -translate-y-1/2"
                    >
                         <div className="flex flex-col gap-3">
                             <div className="flex flex-col items-end">
                                <span className="uppercase tracking-widest text-[8px] opacity-50 mb-0.5">Cycle</span>
                                <span
                                  className="text-[10px] tracking-[0.15em] italic opacity-80"
                                  style={{ fontFamily: 'var(--font-serif)' }}
                                >
                                  {data.phase}
                                </span>
                             </div>
                             <LiveReading base={data.current} previous={data.previous} label={data.label} unit={data.unit} />
                         </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <div className="flex flex-col items-center gap-2">
            <motion.p
                key={visibleSentence}
                initial={{ opacity: 0, y: 5, filter: "blur(4px)" }}
                animate={{ opacity: 0.9, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -5, filter: "blur(4px)" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-[18px] md:text-[20px] tracking-wide italic font-light leading-relaxed h-8 text-center px-4"
                style={{ fontFamily: 'var(--font-serif)' }}
            >
                {visibleSentence}
            </motion.p>

             {isQuestUnlocked && LENS_CONFIG[activeLens].unlockText && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="pointer-events-auto mt-2 flex items-center gap-3 px-4 py-2 rounded-sm shadow-sm hover:brightness-95 transition-all group"
                    style={{
                      border: `1px solid rgba(0, 61, 44, 0.2)`,
                      backgroundColor: HEX_BG
                    }}
                >
                    <Sparkles size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] uppercase tracking-[0.1em]">{LENS_CONFIG[activeLens].unlockText}</span>
                </motion.button>
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* LENS SELECTOR */}
      <div className="absolute bottom-12 w-full px-6">
        <div className="flex justify-center gap-6 md:gap-10 overflow-x-auto pb-4 no-scrollbar mask-fade-sides items-end h-20">
          {(Object.keys(LENS_CONFIG) as LensType[]).filter(k => k !== 'NEUTRAL').map((lensKey) => {
             const isActive = activeLens === lensKey;
             const lensData = MOCK_DATA[lensKey];
             const hasActivity = lensData.current > 0;
             return (
                <button
                    key={lensKey}
                    onClick={() => setActiveLens(isActive ? 'NEUTRAL' : lensKey)}
                    className="relative flex flex-col items-center group min-w-[max-content] cursor-pointer"
                >
                <motion.div
                    className="absolute bottom-full mb-3 w-[1px] opacity-30"
                    style={{ background: `linear-gradient(to top, ${HEX_PRIMARY}, transparent)` }}
                    initial={{ height: 0 }}
                    animate={{ height: isActive ? 60 : 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />
                <div
                    className={`text-[10px] uppercase transition-all duration-500 ease-out flex flex-col items-center gap-1 ${
                        isActive
                        ? 'font-medium tracking-normal scale-110'
                        : 'opacity-40 font-light tracking-[0.25em] hover:opacity-70'
                    }`}
                    style={{ fontFamily: 'var(--font-sans)' }}
                >
                    {LENS_CONFIG[lensKey].label}
                    {hasActivity && !isActive && (
                        <div
                          className="w-[2px] h-[2px] rounded-full mt-1"
                          style={{ backgroundColor: `rgba(0, 61, 44, 0.4)` }}
                        />
                    )}
                </div>
                </button>
             );
          })}
        </div>
      </div>
    </div>
  );
}
