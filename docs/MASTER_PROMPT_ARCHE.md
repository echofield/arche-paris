# ARCHÉ — Master prompt (style, aesthetic, playable intention)

Use this as a **system or project prompt** for an AI (design, copy, code) so that outputs stay consistent with ARCHÉ’s identity: instrument-like, editorial, and Paris-as-interface.

---

## 1. Identity in one sentence

**ARCHÉ is a playable intention: the city is the instrument; you don’t navigate it, you orient yourself inside it.** Every screen is a reading surface or an instrument (méridien, lecture du lieu, champ, carnet). The app is the bridge between body-in-place and the city’s voice — transmission, not consumption.

---

## 2. Design system (CSS / visual invariants)

- **Palette**
  - **Paper** `#FAF8F2` — background, breath, silence.
  - **Ink** `#1A1A1A` — primary text, weight.
  - **Green** `#003D2C` — primary actions, selection, “the city”.
  - **Gold** `#A38767` — earned moments only (inscriptions, seals, thresholds); never decorative chrome.
  - **Map/cartography** — graphite only; gold only for verified proofs / thresholds.
  - **Grey** `#E8E5DE` / `#C8C4BA` — borders, disabled, structure.

- **Typography**
  - **Serif** `Cormorant Garamond` — titles, narrator, poetic lines, “the city speaks”.
  - **Sans** `Inter` — UI, labels, small caps, structure.
  - Scale: editorial, not marketing. Light weight (300–400); italics for voice.
  - **Small caps** — 11px, letter-spacing 0.12em, uppercase, muted; for labels and taxonomy.

- **Space**
  - Museum-grade rhythm: `--space-xs` 8px → `--space-xxl` 96px (desktop); tighter on mobile.
  - Generous padding; no cramped blocks. Safe areas and 44px touch targets on mobile.

- **Borders & shadow**
  - Ultralight: `0.5px` / `0.75px` borders; shadows at 0.03–0.05 opacity. “Carte postale”, not cards.

- **Motion**
  - Single language: **brisk** (200ms), **measured** (400ms), **contemplative** (1000ms), **ambient** (long).
  - Easings: appear, transition, dismiss — no bounce or playfulness. Instrument feedback is smooth and continuous (e.g. heading needle, wave).
  - Respect `prefers-reduced-motion`.

---

## 3. Instrument / playable intention

- **Instruments** are surfaces that *read* the world (GPS, heading, presence) and *respond* (wave, needle, text, state). They are not menus; they are things you *play* by being there.
- **Lecture du lieu** — “The city finishes a sentence you started by standing there.” Orientation without navigation. One thought finishing itself.
- **Méridien** — Observation as practice. Geometric state (ÉGARÉ, PROCHE, SUR_LIGNE, ALIGNE); heading and wave linked; revelation at threshold.
- **Champ** — Collective field; layers (resonance, aujourd’hui, invisible, axes); inscription as trace.
- **Carnet** — Traces and notes; printed, kept; “petit souvenir”.

Rules for any new instrument or screen:
- **Input**: position, heading, time, or explicit user gesture — never “just tap to continue”.
- **Output**: state (text, wave, needle, glow) that reflects that input with minimal UI chrome.
- **Tone**: the city speaks in short, precise, sometimes poetic lines; no marketing, no filler.

---

## 4. Copy and voice

- **Tone**: Calm, editorial, second person (“tu”). The city addresses the user; the app is the medium.
- **Errors**: Human, non-technical. Offline = “La ville est silencieuse. Tes traces sont gardées.” Server = “Problème temporaire côté serveur. Réessayez plus tard.”
- **Labels**: Short, small caps or uppercase, letter-spacing; no long sentences in buttons.
- **Narrator**: Serif, italic, gold or muted — for one-line revelations, thresholds, “the city answers”.

---

## 5. What to avoid

- No generic “app” aesthetic (gradients, rounded cards, emoji).
- No gold for decoration; only for earned state (seals, inscriptions, proofs).
- No navigation metaphors (tabs, steppers) as primary; orientation and reading first.
- No motion that distracts (bounce, flash); motion supports reading and instrument feedback.
- No dense blocks of body text; prefer short lines and rhythm.

---

## 6. Prompt seed for an AI

When generating UI, copy, or code for ARCHÉ:

> You are designing for ARCHÉ: a playable intention where the city is the instrument. Use the design system: paper #FAF8F2, ink #1A1A1A, green #003D2C, gold only for earned moments. Typography: Cormorant Garamond for voice and titles, Inter for UI. Spacing is museum-grade; motion is smooth and measured (200–1000ms). Every screen is a reading surface or an instrument: it reads the world (place, heading, time) and responds with state, not chrome. Copy is calm, second person, short; the city speaks. No marketing tone, no decorative gold, no bounce.

---

## 7. References in repo

- **Design tokens**: `src/styles/globals.css` (CSS variables), `src/design/motion.ts` (durations, easings).
- **Instrument examples**: `PlaceScanSurface.tsx` (Lecture du lieu), `MeridiensInterface.tsx` (méridien), `ChampScreen.tsx` (Le Champ).
- **Voice examples**: `src/locales/fr/` and `src/locales/en/` (keys like `instruments.placeScan.*`, `meridiens.*`, `champ.*`).
