# Auto-audit agent prompt — ARCHÉ

Use this prompt when handing the project to an agent (Supabase agent, Cursor, or other) for audit and fixes. **Process: audit first, then fix.** Do not skip the audit phase.

---

## Process (mandatory)

1. **Phase 1 — Audit only**
   - Run the audit (scope below).
   - **Output a written audit report** (new section in this repo or a dedicated `docs/AUDIT_YYYY-MM-DD.md`).
   - List: findings by category, severity (must-fix / should-fix / nice-to-have), and suggested changes **without applying them**.
   - Stop. Do not modify code in Phase 1.

2. **Phase 2 — Fix (only after Phase 1 is done and reviewed)**
   - Apply fixes **only** for items explicitly approved (or for the severity band agreed: e.g. “fix all must-fix and should-fix”).
   - Each fix should be traceable to an audit item (e.g. “AUDIT: remove duplicate etudes hash branch” in the commit or PR).
   - Re-run relevant checks/tests after changes.

**Why this order:** Avoids blind refactors, keeps a shared baseline, and ensures nothing is broken that the “do not break” list below forbids.

---

## Do not break (coherence rules)

When auditing and when fixing, **do not**:

- **Routing:** Introduce a router library or change from **hash-only** routing (`window.location.hash` + `hashchange` in `App.tsx`). All routes stay in the single `handleHashChange` in `App.tsx`.
- **Entry / boot:** Change the chain `index.html` → `main.tsx` → `ErrorBoundary` → `App` or the fact that there is a single SPA root in `App.tsx`.
- **Card flow:** Change the card lifecycle (no card → CardEntry / CardGate → ready). Do not remove or bypass `card-service` (init, pair, unpair) or `card-gate-client` (token, queue, `getSessionCardCode`). Card Gate remains the primary data path; Vercel proxy `/api/card-gate/*` must still target Supabase Edge `card-gate`.
- **State:** Introduce Redux/Zustand or another global store. Global state stays: App local state + `LanguageProvider`, `SyncStateProvider`, `WhisperProvider` only.
- **Design philosophy:** Violate the rules in `docs/DESIGN_PHILOSOPHY.md` (e.g. no raw coordinates in UI, no second GPS paradigm, verify() for presence, Paris as frame, no dead ends in UI).
- **Contracts:** Change the frontend contracts for instruments without updating the docs: `docs/PLACE_SCAN_FRONTEND_CONTRACT.md`, `docs/MERIDIEN_*` (if any), and any other contract files. If you change an API shape, update `src/lib/api.ts` types and the relevant contract.
- **Supabase Edge / CORS:** Change CORS behavior for Edge Functions without following the in-code pattern in `supabase/functions/_shared/cors.ts` and the runbook in `docs/SUPABASE_AGENT_PROMPT_PLACE_SCAN_CORS.md`. OPTIONS must be handled inside each function; no reliance on dashboard CORS for Functions.
- **i18n:** Remove or bypass `LanguageProvider` / `useTranslation` / `t` / `tArray`. Keep FR as default; EN as secondary. Do not hardcode user-facing strings that already exist in `src/locales/`.
- **API boundary:** Split or duplicate the single `api` object in `src/lib/api.ts` in a way that breaks existing call sites. New endpoints can be added; existing method signatures and behavior (e.g. Card Gate vs Supabase invoke) must remain coherent with `REPO_AUDIT.md` section 1.4.

**If a fix would violate any of the above, do not apply it** — instead note it in the audit as “blocked by coherence rules” and suggest an alternative or a design decision.

---

## Audit scope

Use this checklist. Prefer referencing the existing audit where it still applies: `docs/REPO_AUDIT.md`.

### 1. Architecture and boundaries
- [ ] Entry: `index.html` → `main.tsx` → `App.tsx`; hash routing only; no new router.
- [ ] State: only App state + LanguageProvider, SyncStateProvider, WhisperProvider.
- [ ] Backend: Supabase client + Edge Functions; Card Gate via `card-gate-client` + `/api/card-gate` proxy; no new parallel auth or data path without explicit need.
- [ ] Dependencies: no new circular imports; `lib/api.ts` and `card-gate-client` / `card-service` boundaries unchanged in spirit.

### 2. Duplication and dead code
- [ ] Same pattern in multiple files (e.g. sheet title style, error handling, “current card” helpers). Prefer one shared implementation or doc.
- [ ] Unused imports or components (e.g. `CollectionMap` if still not rendered).
- [ ] Duplicate logic (e.g. two ways to get “current card” for API; duplicate hash branch for same route).
- [ ] Commented-out or stub code that is never used (e.g. codex-helpers) — document or remove.

### 3. Consistency
- [ ] `cardId` prop convention: `null` vs `'unknown'` vs missing — one convention and document it.
- [ ] Error/loading states: which screens have explicit loading/error UI vs silent failure; align with “no dead ends” (DESIGN_PHILOSOPHY).
- [ ] Motion: single motion library (framer-motion vs motion/react) and consistent usage.
- [ ] Types: `lib/api.ts` types vs actual Edge/DB responses; any new endpoint has types and, if user-facing, contract doc.

### 4. Performance and maintainability
- [ ] Heavy screens: which are lazy-loaded; whether more should be (bundle, TTI).
- [ ] Context: SyncStateContext value identity; unnecessary re-renders.
- [ ] Lists: large lists without virtualization; acceptable or not for current data sizes.
- [ ] Invoke vs Card Gate: when to use `invoke()` (Supabase) vs `invokeCardGateRequest`; document in code or in REPO_AUDIT.

### 5. Supabase-specific (if using Supabase agent)
- [ ] Edge Functions: each function handles OPTIONS and attaches CORS headers from `_shared/cors.ts`; no dashboard-only CORS for Functions.
- [ ] Migrations and RLS: schema and policies aligned with function behavior; no raw location persistence beyond current design.
- [ ] Secrets and env: `CORS_ORIGIN` and other function secrets documented or in runbook.

### 6. Design philosophy alignment
- [ ] No raw coordinates/accuracy in production UI; one short i18n line for “witness” states.
- [ ] Presence: state changes (seal, unlock, etc.) go through verify(); no second GPS paradigm.
- [ ] Privacy: no new raw location persistence; server receives only what’s already specified.
- [ ] Paris as frame: bbox and “for now” copy; no over-promise of coverage.

---

## Output format for Phase 1 (audit report)

Produce a report that includes:

1. **Summary:** One short paragraph (what was audited, main risks).
2. **Findings table:** | Category | Finding | Severity | Suggested change (no code yet) |
3. **Do-not-break check:** Confirm no suggested change violates the “Do not break” list above; if one does, mark it “blocked — see coherence rules.”
4. **References:** Links to `docs/REPO_AUDIT.md`, `docs/DESIGN_PHILOSOPHY.md`, and any contract or runbook used.

Save the report as `docs/AUDIT_YYYY-MM-DD.md` (or append a new section in this file) so the team can review before Phase 2.

---

## After the audit

- **Human/team:** Review the audit report and decide which items to fix (e.g. all must-fix + should-fix).
- **Agent (Phase 2):** Apply only approved fixes; keep each change small and traceable to the audit.
- **Re-run:** Tests and a quick smoke of card flow, routing, and one instrument (e.g. place scan or méridien) to ensure coherence is preserved.
