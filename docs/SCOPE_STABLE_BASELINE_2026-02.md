# SCOPE — Stable Baseline (Feb 2026)

**Cursor: read this file first before executing the ARCHÉ Stable Baseline work.** It is the single source of truth for scope, invariants, and Cursor-proof rules.

---

## Non-Negotiables

- Follow [docs/UI_STABILIZATION_AND_MOBILE_GUIDE.md](UI_STABILIZATION_AND_MOBILE_GUIDE.md).
- Motion: only [src/design/motion.ts](../src/design/motion.ts); no hardcoded durations/easings.
- Layout: inline styles for layout in core shells; no Tailwind layout there.
- Keep zones symbolic (PAR-01..PAR-20). Do **not** add PostGIS.
- Preserve single Aura page; no new pages.

---

## PHASE 1 — Deploy baseline (unblock prod)

**1.1 Supabase CLI (manual)** — Run `supabase login` then `supabase link --project-ref <PROJECT_REF>`; confirm with `supabase status`.

**1.2 Deploy Edge Function** — `supabase functions deploy card-gate` from project root.

**1.3 Verify production snapshot** — On production origin, trigger `GET /api/card-gate/world/snapshot?h3_center=PAR-14`. Pass: 200 OK, JSON has `me` with `authenticated`, `card_id`, `zones`, `me.character` (null or object).

**1.4 Add `me.locationTrust` (optional, non-breaking)** — Backend: in [supabase/functions/card-gate/index.tsx](../supabase/functions/card-gate/index.tsx), add `locationTrust: 'unknown'` to `me` in `/world/snapshot`. Frontend: in [src/lib/api.ts](../src/lib/api.ts), extend `WorldSnapshotData.me` with `locationTrust?: 'unknown' | 'low' | 'medium' | 'high'`. Re-deploy card-gate.

---

## PHASE 2 — MVP loop audit (targeted, Tier A only)

**Scope:** Homepage → Aura → Oracle overlay open/close → Map → back to Aura at 375px, 768px, 1440px. Use [docs/AUDIT_PLAYBOOK_MVP_LOOP.md](AUDIT_PLAYBOOK_MVP_LOOP.md). Fix **Tier A (blockers) only**; do not do Tier B/C.

- Mobile overflow / safe-area: shells (AuraPage, HomepageV1, PersonalMemoryMap); inline layout, safe-area `bottom` ≥ 30px.
- Dead navigation / missing back: App.tsx and screens in the loop.
- Crashes from undefined snapshot: guard `worldSnapshot?.me?.aura`, `worldSnapshot?.me?.character`.
- Oracle overlay motion: OracleMessageFlow.tsx — use `motion.t(...)` / `motion.ease(...)`; keep reduced-motion.
- GPS permission confusion: defer to Phase 3.

---

## PHASE 3 — TerritoryResolver (symbolic zone, no PostGIS)

**Goal:** Stable, trustworthy zone (PAR-XX) with calibration and hysteresis; instrument-like, not jittery.

**3.1 New module: TerritoryResolver** — Path: e.g. `src/utils/territory-resolver.ts` or `src/hooks/useTerritoryResolver.ts`. Use `watchPosition` (enableHighAccuracy, timeout 15s). Calibration burst (2–4s): 10–25 fixes, reject stale (>5s) and accuracy > 50m; fuse via weighted average (weight = 1/accuracy²). Zone from shared `inferArrondissementFromGeo` (move from AuraPage L134, PersonalMemoryMap L107, ChampScreen L67 into one shared util; resolver calls it). Hysteresis: change zone only if candidate stable ≥ 8s and ≥ 3 consecutive usable samples (accuracy ≤ 50m); if weak, keep last stable 30–90s. Expose: `zoneId`, `status: 'calibrating' | 'approximate' | 'stable'`, optional `accuracyM`, `samplesCount`, stable zone for API. UI: calm labels (“Calibration…”, “Position approximative” or nothing when stable). API: send `h3_center=PAR-XX`; optional metadata: `ts`, `accuracy_m`, `samples_n`, `zone_confidence`, `method: 'watch'`, rounded `lat`/`lng` for logging.

**3.2 Single source of truth for zone (Cursor-proof)**

- **Resolver state in one place:** One hook or a tiny shared store/context consumed by both Aura and Map so both screens use the same zone and cannot disagree when both are mounted. Avoid duplicate `watchPosition` instances (e.g. one hook at app/layout level or a shared context provider).
- **Fallback zone policy:** Use fallback zone (e.g. PAR-10) **only** when `status !== 'stable'` and there is **no** last-stable zone; otherwise **always** use last-stable zone. Do not default to PAR-10 whenever status is calibrating—that would kill the instrument feel.
- **No duplicate inference rule:** No arrondissement inference logic may live inside screen components; all zone-from-geo calls go through the shared util (or the resolver that uses it). Prevents future duplication.

**3.3 Integrate resolver into the loop** — AuraPage and PersonalMemoryMap use the same resolver/shared zone. Snapshot calls: pass resolver’s `zoneId` (or fallback per policy above) as `h3_center`; optionally append metadata.

**3.4 Backend (card-gate) — optional trust, no PostGIS** — No PostGIS, no distance checks. Optional: parse metadata; compute soft `locationTrust` from freshness, accuracy, plausible movement; set `me.locationTrust` to `'low'|'medium'|'high'` when metadata present; else `'unknown'`. Do not block behavior on trust.

**3.5 Types** — [src/lib/api.ts](../src/lib/api.ts): `WorldSnapshotData.me.locationTrust` as above.

---

## PHASE 4 — Homepage Oracle callout

**Current state:** HomepageV1 uses `worldSnapshot?.me?.aura?.questCallout` and `onEnterAura` for `action === 'open_oracle'`. Backend returns `questCallout: { title: 'Question', subtitle: 'La ville répond.', ctaLabel: 'ÉCOUTER →', action: 'open_oracle' }`.

**Tasks:** Verify copy (“Question”, “La ville répond.”, “ÉCOUTER →” / “CONTINUER →”); verify flow (CTA opens Oracle overlay or navigates to Aura with overlay); guard missing `me.aura` / `questCallout` with existing fallbacks so the page never breaks.

---

## Implementation order

1. Phase 1 — Deploy + optional `me.locationTrust`.
2. Phase 2 — MVP loop audit, Tier A only.
3. Phase 3 — TerritoryResolver, shared arrondissement util, integrate AuraPage + Map, optional backend trust.
4. Phase 4 — Verify and tighten homepage Oracle callout.

---

## Acceptance criteria (summary)

- Deploy: production snapshot 200 with `me`, `me.character`, optional `me.locationTrust`.
- MVP loop: no Tier A issues at 375px (spot-check 768/1440).
- Territory: resolver reduces jitter; calibration/approximate state shown; no PostGIS; optional `me.locationTrust` from metadata.
- Consistency: no new hardcoded motion; no layout drift; single Aura page; UI guide and motion tokens respected.
