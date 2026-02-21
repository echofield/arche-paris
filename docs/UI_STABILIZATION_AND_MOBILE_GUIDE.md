# UI Stabilization & Mobile-First Design Guide

## Role of this document

This guide translates project design authorities into implementation rules. It does not define visual or motion values.

**Authoritative sources:**

- [src/design/motion.ts](src/design/motion.ts)
- [docs/DESIGN_AUDIT_STATUS_2026-02-20.md](docs/DESIGN_AUDIT_STATUS_2026-02-20.md)
- [docs/DESIGN_COLOR_RULES.md](docs/DESIGN_COLOR_RULES.md)

---

## Non-Negotiable Constraints

### Motion authority

Do **not** introduce raw animation durations or easing values. All animation timing must originate from `src/design/motion.ts`.

If a required motion does not exist:

- **→ extend motion.ts**
- **→ do NOT hardcode locally.**

AI assistants tend toward local fixes unless explicitly forbidden.

### Mobile-first alignment

The guide defines **invariants**, not a full rewrite of layout rules:

- **No** absolute positioning for structural layout.
- Absolute positioning **allowed only** for aura-layer elements (overlays, nav, fixed UI).
- Layout containers must remain **flex/grid responsive**.
- **Safe-area padding** required for mobile edges.

---

## Tech Stack Available

- **Animation:** framer-motion v12 (motion, AnimatePresence, gestures, layout)
- **Icons:** lucide-react (ArrowLeft, Globe, Sparkles, Fingerprint, etc.)
- **UI Primitives:** Full Radix UI suite (@radix-ui/react-*)
- **Styling:** Tailwind v4 — use **inline styles** for layout-critical elements
- **Utilities:** clsx, tailwind-merge, class-variance-authority
- **Forms:** react-hook-form
- **Notifications:** sonner
- **Charts:** recharts
- **Carousel:** embla-carousel-react
- **Drawer:** vaul
- **Command palette:** cmdk

---

## Design System

- `--background`: #FAF9F6 (warm paper white)
- `--primary`: #003D2C (deep forest green)
- `--font-serif`: 'Cormorant Garamond' (poetic text, sentences)
- `--font-sans`: 'Inter' (UI labels, readings)

---

## CRITICAL: Layout Stability Rules

**Always use inline styles for:**

- `position: absolute | relative | fixed`
- `display: flex` with `gap`, `alignItems`, `justifyContent`
- `width`, `height`, `top`, `bottom`, `left`, `right`
- `zIndex` layering

**Why:** Tailwind v4 build may not scan new files properly, causing layout collapse. Inline styles bypass this entirely.

**Pattern:**

```tsx
// GOOD — Stable
<div
  style={{
    position: 'absolute',
    bottom: '30px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
  }}
>

// AVOID for layout — May break
<div className="absolute bottom-8 w-full flex justify-center gap-8">
```

---

## Mobile-First Requirements

- **Touch targets:** Minimum 44×44px for all interactive elements
- **Font sizes:** Never below 10px; prefer 12–14px for body
- **Spacing:** Use explicit pixel values for critical layout, not relative units
- **Safe areas:** Account for notch/home indicator with `bottom: '30px'` minimum
- **Scroll:** Use `overflowX: 'auto'` with `-webkit-overflow-scrolling: touch`
- **Gestures:** Leverage framer-motion drag, tap, pan handlers

**Responsive breakpoints (inline):**

```ts
const isMobile = window.innerWidth < 768;
// Or: const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
```

---

## Animation Patterns (framer-motion)

Use **only** durations and easings from `src/design/motion.ts`. Example pattern (values must come from motion tokens):

- Fade + blur transition for text: `initial` / `animate` / `exit` with opacity, y, filter; `transition` from motion.ts
- Continuous pulse for ambient elements: scale cycle with token duration
- SVG waveform: requestAnimationFrame for path `d` updates

---

## Component Structure: ArcheInterface

```
ArcheInterface (main container, 100vh)
├── nav (absolute top, z-50)
│   ├── back button
│   ├── civic state indicator (center)
│   └── lang toggle
├── center visualization (flex center, z-10)
│   ├── background field (600px circle)
│   ├── membrane (blur effect)
│   ├── rings & orbits (rotating)
│   ├── FieldStatue (hover tooltip)
│   └── center dot (pulsing)
├── readings panel (absolute bottom: 140px, z-40)
│   ├── WaveformReading (SVG animated)
│   ├── LiveReading (fluctuating numbers)
│   └── poetic sentence
└── lens selector (absolute bottom: 30px)
    └── buttons with gap: 32px
```

**State types:** `LensType`, `CivicState` (e.g. CITOYEN | TEMOIN | VEILLEUR).

**z-index hierarchy:** nav(50) > readings(40) > statue(35) > viz(10–20) > texture(0).

---

## When adding new UI elements

1. Use **inline styles** for all positioning/layout
2. Test on **mobile viewport (375px)** first
3. Ensure touch targets are **44px minimum**
4. Add framer-motion animations using **motion.ts tokens only**
5. Respect z-index hierarchy above

---

## Alignment with project contracts

- **Motion:** All durations and easings from [src/design/motion.ts](src/design/motion.ts). When using framer-motion, pass e.g. `transition={{ duration: motion.t('measured'), ease: motion.ease('appear') }}` (import the motion token module). See [docs/DESIGN_AUDIT_STATUS_2026-02-20.md](docs/DESIGN_AUDIT_STATUS_2026-02-20.md) §4 and §7.
- **Design baseline:** [docs/DESIGN_AUDIT_STATUS_2026-02-20.md](docs/DESIGN_AUDIT_STATUS_2026-02-20.md). Color rules: [docs/DESIGN_COLOR_RULES.md](docs/DESIGN_COLOR_RULES.md).

---

*Cursor can be instructed: “Follow UI_STABILIZATION_AND_MOBILE_GUIDE.md” to inherit motion discipline, layout discipline, and design-audit alignment.*
