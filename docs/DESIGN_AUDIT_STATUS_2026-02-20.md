# ARCHÉ Design Audit — Status Snapshot

Date: 2026-02-20
Scope: UX subtlety, visual hierarchy, motion coherence, production stability (no redesign)
Reference intent: instrument feel, quiet luxury, minimal narration

## 1) Current Position (Executive Summary)

- Overall status: Stable enough for iterative polish, not yet final-quality uniformity.
- Design maturity: Mid-to-high on direction, medium on consistency across pages.
- Main progress: Mon Paris hierarchy and visual weight improved; Aura layout stabilized; motion token system exists.
- Main gap: Cross-page consistency (especially legacy sections) still uneven.

## 2) Recently Landed UI Work (Verified in Git)

- `8441a2b` `style(home): subtle polish for homepage hierarchy and readability`
- `71a0c1f` `fix(arche-interface): restore centered layout and spaced lens selector`
- `b9f7685` `style(myparis): rebalance header, lighten controls, and polish map readability`
- `8af385c` `fix(aura): restore complete ArcheInterface with proper layout`
- `62a29a3` and `9cbae52` aura layout reliability follow-ups

Key files touched for Mon Paris polish:
- `src/components/PersonalMemoryMap.tsx`
- `src/components/PersonalMemoryMap/MapLayers.tsx`
- `src/components/PersonalMemoryMap/ZoneOverlay.tsx`

## 3) Page-by-Page Audit Status

### Homepage

Status: Partial pass

What is better:
- Reduced visual noise and improved readability rhythm.

Still to validate:
- Final nav density on desktop/mobile.
- CTA/poetry hierarchy in low-contrast displays.
- Map stroke consistency on all viewport sizes.

### Mon Paris (Personal Memory Map)

Status: Safe-now pass

Applied:
- Header moved above map (fixes top-heavy balance).
- Filter/tab controls lightened (less blocky, more ghost/outline feel).
- Absence list visual density reduced (no boxed calculator look).
- Journal textarea switched to underline style.
- FR wording pass in walk controls (`Aujourd'hui`, `Ajouter une marche`, etc.).
- Saved-on-device meta information de-emphasized.

Still to validate:
- Touch ergonomics on smaller screens for absence links.
- Marker contrast with different ambient light/monitor profiles.

### Aura / Presence

Status: Stabilized, still in refinement

Applied:
- Layout and centering fixes across recent commits.

Still to validate:
- Typography/encoding edge cases in all locale paths.
- Final naming/labels consistency with Presence language.

### Oracle Overlay / Invocation Flow

Status: Spec-ready, implementation alignment pending full pass

- Detailed motion and interaction spec exists.
- Needs one strict pass to ensure all durations/easings come from `src/design/motion.ts` only.

## 4) Motion System Contract

Status: Implemented foundation

- Token source exists: `src/design/motion.ts`.
- Pattern already used in key UI transitions.

Remaining enforcement work:
- Remove remaining ad-hoc timing/easing in legacy components.
- Ensure one `stone` animation authority at a time.
- Final reduced-motion audit across overlays/panels/map states.

## 5) Quality Gates (Current)

- Build status: passing (`vite build` success on latest Mon Paris patch run).
- Risk level: medium-low for style changes, medium for interaction consistency.
- Regression risk hotspots:
- mixed inline styles + legacy classes
- duplicated labels across old/new components
- gradual drift from motion tokens in new quick patches

## 6) Recommended Next Sequence (No Redesign)

1. Oracle overlay strict token compliance pass (single PR).
2. Aura/Presence copy + encoding consistency pass (single PR).
3. Cross-page micro-contrast pass (map strokes, muted text opacities, focus states).
4. Mobile tap-target check for Mon Paris controls.
5. Freeze visual tokens for v1 stability window.

## 7) Definition of “Design Stable” for ARCHÉ

ARCHÉ can be considered design-stable when all conditions are true:

- Every major transition uses `src/design/motion.ts` tokens.
- No hardcoded fallback labels remain in critical nav/flows.
- Mon Paris, Homepage, Aura/Presence feel like one instrument family.
- Reduced-motion mode remains readable and coherent.
- No known UTF/encoding artifacts in FR production views.

---

Owner note:
This audit is intentionally operational. It tracks what is already shipped, what is safe-now complete, and what still blocks a final coherence pass.
