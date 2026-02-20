import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Globe } from 'lucide-react';

interface ArcheInterfaceProps {
  onBack: () => void;
  cardId?: string | null;
  onOpenKept?: () => void;
  onEnterChamp?: () => void;
}

type LensType = 'CLARTE' | 'ANCRAGE' | 'ECHO' | 'MOUVEMENT' | 'ALIGNEMENT' | 'OMBRE';

const LENSES: Array<{ key: LensType; label: string; sentence: string }> = [
  { key: 'CLARTE', label: 'CLARTÉ', sentence: 'Le regard perce la brume.' },
  { key: 'ANCRAGE', label: 'ANCRAGE', sentence: "Ici, la présence s\'ancre." },
  { key: 'ECHO', label: 'ÉCHO', sentence: 'La ville se souvient de vous.' },
  { key: 'MOUVEMENT', label: 'MOUVEMENT', sentence: 'L\'horizon recule.' },
  { key: 'ALIGNEMENT', label: 'ALIGNEMENT', sentence: 'Une direction se dessine.' },
  { key: 'OMBRE', label: 'OMBRE', sentence: 'Une densité invisible pèse.' },
];

const BG = 'var(--paper, #FAF8F2)';
const GREEN = 'var(--green, #003D2C)';

export function ArcheInterface({ onBack }: ArcheInterfaceProps) {
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [activeLens, setActiveLens] = useState<LensType | null>(null);

  const sentence = useMemo(() => {
    if (!activeLens) return 'La présence reste discrète.';
    return LENSES.find((l) => l.key === activeLens)?.sentence ?? 'La présence reste discrète.';
  }, [activeLens]);

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{ background: BG, color: GREEN }}
    >
      <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] opacity-60 transition-opacity hover:opacity-90"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          <span>Retour</span>
        </button>

        <button
          type="button"
          onClick={() => setLang((prev) => (prev === 'FR' ? 'EN' : 'FR'))}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] opacity-55 transition-opacity hover:opacity-85"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <Globe size={11} strokeWidth={1.5} />
          <span>{lang}</span>
        </button>
      </nav>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative h-[360px] w-[360px]">
          <motion.div
            className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ border: `1px solid rgba(0,61,44,0.08)` }}
            animate={{ opacity: activeLens ? 0.12 : 0.08, scale: activeLens ? 1.02 : 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,61,44,0.10) 0%, rgba(0,61,44,0.03) 55%, rgba(0,61,44,0.00) 100%)',
              filter: 'blur(0.5px)',
            }}
            animate={{
              scale: activeLens === 'MOUVEMENT' ? 1.06 : 1,
              opacity: activeLens === 'CLARTE' ? 0.75 : 0.55,
            }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[140px] w-[140px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ border: `1px solid rgba(0,61,44,0.14)` }}
            animate={{ rotate: 360, opacity: activeLens === 'ANCRAGE' ? 0.3 : 0.18 }}
            transition={{ duration: 36, ease: 'linear', repeat: Infinity }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: GREEN }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[112px] z-20 flex justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={sentence}
            initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
            animate={{ opacity: 0.82, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="text-center text-[20px] italic"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {sentence}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-8 z-30 px-6">
        <div className="mx-auto flex w-full max-w-[980px] flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {LENSES.map((lens, index) => {
            const isActive = activeLens === lens.key;
            return (
              <div key={lens.key} className="inline-flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setActiveLens(isActive ? null : lens.key)}
                  className="text-[10px] uppercase tracking-[0.18em] transition-all duration-300"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    color: GREEN,
                    opacity: isActive ? 0.95 : 0.46,
                    transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  {lens.label}
                </button>
                {index < LENSES.length - 1 && (
                  <span className="text-[10px] opacity-30" aria-hidden="true">•</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
