# ARCHÉ — Audit Playbook: MVP Loop & Stable Baseline

Use this **before** a full audit. Ship a stable snapshot first, then audit the canonical path only. Full-audit comes after the loop is solid.

---

## Deploy target

- **Frontend:** Vercel — prod `https://arche-paris.vercel.app`, main domain `https://www.xn--arch-paris-e7a.com`
- **Backend:** Supabase Edge — `card-gate` (`supabase/functions/card-gate/index.tsx`), proxied at `/api/card-gate/*`

---

## 1. Stable snapshot deploy gate

Deploy **only if** all are true:

| Check | Command / How |
|-------|----------------|
| Build passes | `npm run build` (no errors) |
| Key flows don’t crash | Manual: login/logout, homepage load, Aura open, Map open, Oracle overlay open/close |
| No obvious mobile break | Test at ~375px width (iPhone-ish); no horizontal overflow, no clipped safe-area |

If any fail → fix before deploy. Then deploy to get a real URL for phone testing and sharing.

---

## 2. Minimum smoke-test (post-deploy)

Run on **production URL** (main domain or Vercel):

1. Load homepage → no white screen, no console errors.
2. Tap to Aura (or equivalent entry) → Aura loads.
3. Open Oracle overlay (if visible) → overlay opens; close → returns.
4. Go to Map → map or “you are here” visible.
5. Back to Aura → state feels persistent (no obvious reset).

If any step crashes or blocks → Tier A fix before calling baseline stable.

---

## 3. Tiered audit (order matters)

### Tier A — Blocking (fix immediately)

- [ ] Mobile layout break / overflow / clipped safe-area
- [ ] Dead navigation / missing back
- [ ] Crashes due to undefined data (e.g. missing `me.aura` / snapshot fields)
- [ ] GPS permission flow confusion
- [ ] Oracle overlay motion token violations (use `motion.ts` only; no hardcoded durations/easings)

### Tier B — Clarity (“what do I do now?”)

- [ ] Homepage callout: Meridian CTA → Oracle callout (“Question / La ville répond / ÉCOUTER →”)
- [ ] “Field speaks” sentence mechanic
- [ ] “Door” axis interactions (Aura)
- [ ] “My map” vs “the map” confusion

### Tier C — Polish (later)

- [ ] Micro-copy
- [ ] Spacing
- [ ] Icon refinement
- [ ] Rare animation tuning

---

## 4. Canonical user path (audit this first)

**Route:** Homepage → Aura → Oracle overlay → Map → back to Aura.

Do **not** audit every page. Audit this loop only until it’s solid.

| Step | Page / action | Viewport(s) | Pass criteria |
|------|----------------|-------------|----------------|
| 1 | Homepage — sees callout | 375px, 768px, 1440px | Callout visible; no overflow; tap target ≥44px |
| 2 | Open Aura — reads + axis doors + vestige | 375px, 768px | Aura loads; axis/vestige visible; no crash on missing snapshot |
| 3 | Open Oracle overlay → close → return | 375px, 768px | Overlay opens/closes; back returns to Aura; no stuck overlay |
| 4 | Go to Map — “you are here” + one meaningful element | 375px | Map loads; location or placeholder visible; no crash |
| 5 | Return to Aura — persistence | 375px | Aura state doesn’t feel reset; snapshot still drives UI |

**Viewport widths to test:** 375px (mobile), 768px (tablet), 1440px (desktop). Prefer 375px for Tier A.

---

## 5. Quick fixes list (reference)

- **Layout overflow:** Inline styles for layout (see [UI_STABILIZATION_AND_MOBILE_GUIDE.md](UI_STABILIZATION_AND_MOBILE_GUIDE.md)); safe-area `bottom` ≥ 30px.
- **Undefined data:** Guard `worldSnapshot?.me?.aura`, `worldSnapshot?.me?.passport`, etc.; optional chaining and fallbacks.
- **Motion violations:** Replace hardcoded `duration`/`ease` with `motion.t(...)` and `motion.ease(...)` from [src/design/motion.ts](../src/design/motion.ts).
- **Dead back:** Ensure every screen reached from the loop has a working back/exit to homepage or previous step.

---

## 6. After the loop is solid: full audit

Then run a checklist pass (not “audit everything” in one go):

- [ ] Layout rules compliance ([UI_STABILIZATION_AND_MOBILE_GUIDE.md](UI_STABILIZATION_AND_MOBILE_GUIDE.md))
- [ ] Motion tokens compliance ([src/design/motion.ts](../src/design/motion.ts))
- [ ] Mobile safe-area compliance
- [ ] Copy tone compliance (quiet, instrument-like)
- [ ] Data-from-snapshot-only compliance (Aura / Passport module)

---

## 7. Recommended next one task

**Replace the homepage meridian CTA with the Oracle callout** (“Question / La ville répond. / ÉCOUTER →”).  
That improves perceived coherence and is the first thing new users see. Implementation: homepage reads `me.aura.questCallout` from snapshot; CTA opens Oracle overlay (or navigates to Aura with overlay) instead of meridian flow. See handoff and design audit for current callout location (HomepageV1, ~L447–505).

---

*Playbook prepared so we don’t lose momentum: stable deploy → canonical path audit → tiered fixes → full audit.*
