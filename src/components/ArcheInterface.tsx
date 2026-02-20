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

// --- DATA CONFIGURATION ---

// Scientific Instrument Readings
// current: 0.00 - 1.00 (Never reaches 1.0 completely)
// phase: Roman numeral for the current cycle state
// label: The specific scientific attribute being measured
const MOCK_DATA: Record<LensType, { current: number; previous: number; phase: string; label: string; unit?: string }> = {
  NEUTRAL: { current: 0, previous: 0, phase: '—', label: 'VEILLE' },
  CLARTE: { current: 0.284, previous: 0.210, phase: 'I', label: 'DENSITÉ OPTIQUE' },
  ANCRAGE: { current: 0.852, previous: 0.820, phase: 'IV', label: 'RAYON ACTIF', unit: 'm' },
  ECHO: { current: 0.421, previous: 0.450, phase: 'II', label: 'RÉSONANCE' },
  MOUVEMENT: { current: 0.153, previous: 0.110, phase: 'I', label: 'VÉLOCITÉ' },
  ALIGNEMENT: { current: 0.605, previous: 0.600, phase: 'III', label: 'COHÉRENCE' },
  OMBRE: { current: 0.128, previous: 0.080, phase: 'I', label: 'TENSION' }
};

// Poetic & Unlock Configuration
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

// --- SUB-COMPONENTS ---

// 1. Live Instrument Reading (The Fluctuating Number)
function LiveReading({ base, previous, label, unit = '' }: { base: number, previous: number, label: string, unit?: string }) {
    const [displayValue, setDisplayValue] = useState(base);

    // Create the "Drift" effect to simulate analog sensor noise
    useEffect(() => {
        const interval = setInterval(() => {
            // Random micro-fluctuation (+/- 0.005)
            const drift = (Math.random() - 0.5) * 0.01;
            setDisplayValue(() => {
                // Ensure we stay somewhat close to base, don't drift forever
                const next = base + drift;
                return Number(next.toFixed(3));
            });
        }, 800); // Updates slightly slower than 60fps
        return () => clearInterval(interval);
    }, [base]);

    // Format for display (always 3 decimals for scientific feel)
    const formatted = unit === 'm'
        ? (displayValue * 500).toFixed(1) // Map 0-1 to meters roughly
        : displayValue.toFixed(3);

    // Calculate drift direction for subtle arrow
    const isUp = displayValue > previous;

    return (
        <div className="flex flex-col items-end font-mono text-[10px] text-[#003D2C] opacity-60 tabular-nums leading-tight">
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

// 2. Waveform Component (The Living Trace)
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

      // Map 0.0-1.0 to pixels (max 30px amplitude)
      const ampActive = 2 + (current * 30);
      const ampGhost = 2 + (previous * 30);

      // Lens-specific physics
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

        // Active line breathes
        const breath = 1 + Math.sin(time * 2) * 0.05;

        let yActive = centerY + (sine * ampActive * breath);
        let yGhost = centerY + (sine * ampGhost);

        // Soften edges (fade out at sides)
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
            {/* Phantom Trace (Previous State) - Dashed, Faint */}
            <path
                ref={ghostPathRef}
                fill="none"
                stroke="#003D2C"
                strokeWidth="1"
                strokeOpacity="0.15"
                strokeDasharray="4 4"
                strokeLinecap="round"
            />
            {/* Living Line (Current State) - Solid, Breathing */}
            <path
                ref={activePathRef}
                fill="none"
                stroke="#003D2C"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_3px_rgba(0,61,44,0.1)]"
            />
        </svg>
    </div>
  );
}

// --- MAIN COMPONENT ---

export function ArcheInterface({ onBack }: ArcheInterfaceProps) {
  const [activeLens, setActiveLens] = useState<LensType>('NEUTRAL');
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [visibleSentence, setVisibleSentence] = useState(LENS_CONFIG.NEUTRAL.sentence);

  const data = MOCK_DATA[activeLens];
  const isQuestUnlocked = data.current >= 0.8;

  // Delayed sentence update for "Field changes -> Meaning appears" effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleSentence(LENS_CONFIG[activeLens].sentence);
    }, 250);
    return () => clearTimeout(timer);
  }, [activeLens]);

  // Visual state flags
  const isClarte = activeLens === 'CLARTE';
  const isAncrage = activeLens === 'ANCRAGE';
  const isMouvement = activeLens === 'MOUVEMENT';
  const isAlignement = activeLens === 'ALIGNEMENT';
  const isOmbre = activeLens === 'OMBRE';
  const isNeutral = activeLens === 'NEUTRAL';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FAF9F6] text-[#003D2C] font-serif flex flex-col items-center justify-center transition-colors duration-1000">

      {/* GLOBAL MOOD FILTER (Vignette for Ombre) */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-20 mix-blend-multiply"
        animate={{
            boxShadow: isOmbre ? "inset 0 0 150px rgba(0,0,0,0.15)" : "inset 0 0 0px rgba(0,0,0,0)"
        }}
        transition={{ duration: 1 }}
      />

      {/* NOISE TEXTURE (Paper Feel) */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000"
        style={{
            opacity: isClarte ? 0.02 : 0.06,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
        }}
      />

      {/* TOP NAVIGATION */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] opacity-60 hover:opacity-100 transition-opacity font-sans">
          <ArrowLeft size={12} strokeWidth={1} />
          <span>Retour</span>
        </button>
        <button onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] opacity-40 hover:opacity-80 transition-opacity font-sans">
          <Globe size={10} strokeWidth={1} />
          <span>{lang}</span>
        </button>
      </nav>

      {/* MAIN VISUALIZATION - THE INSTRUMENT */}
      <div className="relative flex items-center justify-center z-10 w-full h-full pointer-events-none">

        {/* 1. BACKGROUND FIELD (Atmosphere) */}
        <motion.div
            className="absolute"
            animate={{
                scale: isMouvement ? 1.5 : 1,
                opacity: isClarte ? 0.3 : 0.5
            }}
            transition={{ duration: 2, ease: "easeInOut" }}
        >
             <div className="w-[600px] h-[600px] rounded-full border border-[#003D2C] opacity-[0.03]" />
        </motion.div>

        {/* 2. THE MEMBRANE (Field Deformation) */}
        <motion.div
            className="absolute bg-[#003D2C]"
            animate={{
                width: isAlignement ? 320 : 260,
                height: isAlignement ? 180 : 260,
                scale: isMouvement ? 1.2 : 1,
                x: isOmbre ? -20 : 0,
                opacity: isClarte ? 0.08 : 0.04,
                filter: isClarte ? "blur(0px)" : "blur(40px)",
                borderRadius: isAncrage
                    ? "50%"
                    : isOmbre
                        ? "40% 60% 70% 30% / 40% 50% 60% 50%"
                        : "50%",
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* 3. CALIBRATION BANDS (Rings & Orbits) */}
        <div className="absolute flex items-center justify-center">
            {/* Inner Ring */}
            <motion.div
                className="absolute rounded-full border border-[#003D2C]"
                animate={{
                    width: isMouvement ? 300 : 200,
                    height: isMouvement ? 300 : 200,
                    opacity: isClarte ? 0.4 : 0.1,
                    borderColor: isClarte ? "#003D2C" : "transparent",
                    borderWidth: isMouvement ? "1px" : "0.5px"
                }}
                style={{ borderColor: "#003D2C" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* Orbital Trace */}
            <motion.div
                className="absolute w-[200px] h-[200px]"
                animate={{
                    width: isMouvement ? 300 : 200,
                    height: isMouvement ? 300 : 200,
                    rotate: 360
                }}
                transition={{
                    rotate: {
                        duration: isAncrage ? 120 : 40,
                        repeat: Infinity,
                        ease: "linear"
                    },
                    width: { duration: 1.5 },
                    height: { duration: 1.5 }
                }}
            >
                <motion.div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[2px] w-[4px] h-[4px] bg-[#003D2C] rounded-full"
                    animate={{ opacity: isAncrage ? 0.8 : 0.5 }}
                />
            </motion.div>

             {/* Alignment Vector */}
             {isAlignement && (
                 <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    className="absolute w-[400px] h-[1px] bg-[#003D2C] opacity-10"
                 />
             )}
        </div>

        {/* 4. CENTER DOT (The Witness) */}
        <motion.div
            className="relative z-20 w-1.5 h-1.5 bg-[#003D2C] rounded-full"
            animate={{
                scale: isAncrage ? 1 : [1, 1.2, 1],
            }}
            transition={{ duration: isAncrage ? 0 : 2, repeat: Infinity }}
        >
            {!isAncrage && (
                <motion.div
                    className="absolute inset-0 rounded-full border border-[#003D2C]"
                    animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
        </motion.div>

      </div>

      {/* AXIS READING & INTERPRETATION */}
      <div className="absolute bottom-32 w-full flex flex-col items-center justify-end z-40 pointer-events-none">

        {/* The Waveform + Scientific Data */}
        <AnimatePresence>
            {!isNeutral && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 80 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4 relative w-[300px] flex justify-center"
                >
                    {/* The Waveform */}
                    <WaveformReading
                        lens={activeLens}
                        current={data.current}
                        previous={data.previous}
                    />

                    {/* Scientific Data Display (Floating next to wave) */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="absolute right-[-40px] top-1/2 -translate-y-1/2"
                    >
                         <div className="flex flex-col gap-3">
                             {/* Cycle/Phase Indicator */}
                             <div className="flex flex-col items-end">
                                <span className="uppercase tracking-widest text-[8px] opacity-50 text-[#003D2C] mb-0.5">Cycle</span>
                                <span className="text-[10px] tracking-[0.15em] font-serif italic text-[#003D2C] opacity-80">{data.phase}</span>
                             </div>

                             {/* Live Instrument Reading */}
                             <LiveReading
                                base={data.current}
                                previous={data.previous}
                                label={data.label}
                                unit={data.unit}
                             />
                         </div>
                    </motion.div>

                </motion.div>
            )}
        </AnimatePresence>

        {/* The Sentence */}
        <AnimatePresence mode="wait">
          <div className="flex flex-col items-center gap-2">
            <motion.p
                key={visibleSentence}
                initial={{ opacity: 0, y: 5, filter: "blur(4px)" }}
                animate={{ opacity: 0.9, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -5, filter: "blur(4px)" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="font-serif text-[18px] md:text-[20px] tracking-wide text-[#003D2C] italic font-light leading-relaxed h-8 text-center px-4"
            >
                {visibleSentence}
            </motion.p>

             {/* THE QUEST GATEWAY (Unlock Notification) */}
             {isQuestUnlocked && LENS_CONFIG[activeLens].unlockText && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="pointer-events-auto mt-2 flex items-center gap-3 px-4 py-2 border border-[#003D2C]/20 bg-[#FAF9F6] rounded-sm shadow-sm hover:bg-[#F2F0E9] transition-colors group"
                >
                    <Sparkles size={12} className="text-[#003D2C] opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#003D2C]">{LENS_CONFIG[activeLens].unlockText}</span>
                </motion.button>
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* LENS SELECTOR (Bottom Tuning) */}
      <div className="absolute bottom-12 w-full px-6">
        <div className="flex justify-center gap-6 md:gap-10 overflow-x-auto pb-4 no-scrollbar mask-fade-sides items-end h-20">
          {(Object.keys(LENS_CONFIG) as LensType[]).filter(k => k !== 'NEUTRAL').map((lensKey) => {
             const isActive = activeLens === lensKey;
             const lensData = MOCK_DATA[lensKey];
             // Has activity?
             const hasActivity = lensData.current > 0;

             return (
                <button
                    key={lensKey}
                    onClick={() => setActiveLens(isActive ? 'NEUTRAL' : lensKey)}
                    className="relative flex flex-col items-center group min-w-[max-content] cursor-pointer"
                >
                {/* The Radial Alignment Line */}
                <motion.div
                    className="absolute bottom-full mb-3 w-[1px] bg-gradient-to-t from-[#003D2C] to-transparent opacity-30"
                    initial={{ height: 0 }}
                    animate={{ height: isActive ? 60 : 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />

                {/* Text Label */}
                <div
                    className={`text-[10px] uppercase font-sans transition-all duration-500 ease-out flex flex-col items-center gap-1 ${
                        isActive
                        ? 'text-[#003D2C] font-medium tracking-normal scale-110'
                        : 'text-[#003D2C]/40 font-light tracking-[0.25em] hover:text-[#003D2C]/70'
                    }`}
                >
                    {LENS_CONFIG[lensKey].label}
                    {/* Activity dot */}
                    {hasActivity && !isActive && (
                        <div className="w-[2px] h-[2px] bg-[#003D2C]/40 rounded-full mt-1" />
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
