# ARCHÉ — Full Specification & Technical Summary

**Purpose:** Complete technical spec for handoff, audit, or second-opinion (e.g. another AI). Covers what was done, what does what, and what is next.

**Last updated:** 2026-02-09

---

## 1. Project Overview

**ARCHÉ** is a premium Paris discovery experience: an editorial digital layer tied to a **physical card** (QR code). No points, no leaderboards — presence, trace, and recognition (“la ville te note”).

- **Entry:** Scan card or enter code → Card Gate (activation or login) → Homepage.
- **Auth model:** Card = identity. No email/password. First use = set password; later = login with same password. Session: JWT in memory + httpOnly refresh cookie via Supabase Edge Functions.
- **Stack:** React 18, Vite, TypeScript, Tailwind, hash routing. Backend: Supabase (PostgreSQL, Edge Functions Deno/Hono). Hosting: Vercel (frontend), Supabase (DB + functions).
- **Design:** Cormorant Garamond, parchemin #FAF8F2, vert #003D2C, Mamluk grid. Mobile-first.

---

## 2. What We’ve Done (This Session & Recent)

### 2.1 Security & Repo

- **Secrets:** Moved Supabase project ID and anon key from hardcoded values to env vars. `src/utils/supabase/info.tsx` now uses `import.meta.env.VITE_SUPABASE_PROJECT_ID` and `VITE_SUPABASE_ANON_KEY`.
- **LICENSE:** Added root `LICENSE` (proprietary, ARCHÉ Paris, contact@arche.paris). `package.json`: `"license": "UNLICENSED"`, `"private": true`.
- **.env.example:** Template with `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY` (no real values). `.env` is gitignored.
- **Repo:** GitHub repo is **private**. No code share by link; safe to share **site URL** only.

### 2.2 Dev / Bypass Auth

- **Dev mode:** If URL has `/demo` or `/demo`, `App.tsx` skips `initializeCard()`, sets `cardId: 'DEMO-DEV'`, `appState: 'ready'`, and strips `?card=` from URL. No login, no Card Gate.
- **ChampScreen in dev:** When `cardId === 'DEMO-DEV'` (or `'unknown'`), `loadChampItems` is not called; map is shown empty. Avoids CORS errors in dev.
- **Shareable link for demos:** `https://www.xn--arch-paris-e7a.com//demo` (and `#champ`, `#aura`, etc. as needed).

### 2.3 Le Champ (Collective Map)

- **Copy:** Title “Le Champ” / “The Field”; subtitle FR: “Les traces partagées de la cité.”, EN: “Shared traces of the city.”
- **Map size:** Section `maxWidth` reduced from 900px to 720px (~20% smaller).
- **Data model:** Le Champ shows **shared** inscriptions only: rows from `inscriptions` where `opt_in_field = true`, fetched via Card Gate `GET /champ/items`. Users share from “Ma Carte” by checking “Partager au Champ” when writing an inscription.
- **Doc:** `docs/LE_CHAMP_EXPLANATION.md` explains behaviour and sharing.

### 2.4 Map Display (Champ)

- **Always render map:** `ChampScreen` always renders `ChampMapSection` (and thus `CarteInteractive`), even when `items.length === 0`. “Les traces apparaitront ici.” is shown below when empty.
- **Layout:** `ChampMapSection` container uses `aspectRatio: '2037.566 / 1615.5'` so the SVG has a defined aspect ratio. `CarteInteractive` has CSS fallbacks so strokes stay visible if the draw animation doesn’t run.
- **Diagnostic:** `docs/DIAGNOSTIC_CARTE_PARIS.js` can be run in the browser console to debug map visibility.

### 2.5 CORS & Supabase (Unresolved)

- **Issue:** Preflight (OPTIONS) to Supabase Edge Functions returns `Access-Control-Allow-Origin: *` from Supabase’s gateway, which conflicts with `credentials: 'include'`. Our Edge Function code never sets `*`; evidence (e.g. 503 with `*` in headers) points to Supabase infrastructure.
- **Impact:** Full auth flow (pair, refresh, etc.) and all Card Gate–dependent writes (inscriptions, journal, traces, champ) fail in production from the deployed domain. Dev mode bypasses auth so the app is usable for demos.
- **Docs:** `docs/POURQUOI_CA_NE_MARCHE_PAS.md`, `docs/CORS_PROOF_SUPABASE_INFRASTRUCTURE.md`, `docs/SUPABASE_TICKET_FINAL.md` (for support). Ticket submitted (e.g. SU-323600); free tier = no guaranteed response.

---

## 3. Architecture — What Does What

### 3.1 Frontend (React + Vite)

- **Entry:** `src/main.tsx` → `App.tsx`.
- **App state:** `appState`: `'loading' | 'no_card' | 'validating' | 'invalid' | 'welcome' | 'ready'`. When `'ready'`, main UI is shown. `cardStatus` holds `cardId`, `status`, `message`, optional `cardCode` (for Card Gate).
- **Routing:** Hash-based. `currentScreen` is derived from `window.location.hash`: `''` → homepage, `#champ` → champ, `#aura` → aura, `#quetes` → quetes, `#quete/<id>` → quete detail, `#quest-run/<id>` → quest run, `#collection` → Ma Carte, `#carnet` → carnet, `#etudes` → études, `#seuil` → seuil (quiz), `#meridiens` → méridiens, `#kept` → kept sentences, `#origine`, `#histoire`.
- **Key components (by screen):**
  - **Homepage:** `HomepageV1` — nav, CTA to Ma Carte, links to quêtes, études, carnet, champ, seuil, aura, méridiens.
  - **Le Champ:** `ChampScreen` → `ChampMapSection` → `CarteInteractive` (Paris SVG) + overlay dots for `items` from `loadChampItems(cardId)`.
  - **Ma Carte:** `PersonalMemoryMap` — inscriptions, segments, proofs, “Écrire” with “Partager au Champ” (`opt_in_field`), map state via Card Gate.
  - **Auth surfaces:** `CardEntry` (manual code entry), `CardGate` (check-card → activation or login), `CardActivation`, `CardLogin`. All call Supabase Edge (make-server-9060b10a for check-card/activate/login; card-gate for pair/refresh and all data).
- **i18n:** `useTranslation()` from `src/utils/i18n.tsx`; keys in `src/locales/{fr,en}/*.json` (e.g. `champ.title`, `champ.placeholder` in `champ.json`).

### 3.2 Backend (Supabase)

- **Project ref:** `qvyrpzgxsppkwfvqvgcn` (only in env or docs; not hardcoded in app code).
- **Edge Functions:**
  - **make-server-9060b10a:** `check-card`, `activate-card`, `login-card` (and any other legacy routes). Used for initial card validation and activation/login before pairing.
  - **card-gate:** Main API when “paired”: JWT (short-lived) + httpOnly refresh cookie. Routes include: `POST /pair`, `POST /refresh`, `POST /unpair-session`, `GET /map-state`, `POST /inscriptions`, `GET /champ/items`, `POST /journal/*`, `POST /trace/leave`, proofs, segments, etc. All with CORS and auth as in code (overridden by Supabase gateway in practice).
- **DB (high level):** `cards`, `journal_entries`, `traces`, `inscriptions` (with `opt_in_field`), `engraved_segments`, `meridian_proofs`, `rate_limits`, etc. RLS and policies are set so that sensitive tables are only accessed via service_role from Edge Functions, not from anon/client.

### 3.3 Auth & Client API

- **card-service.ts:** `initializeCard()` reads `?card=` and optional `/demo` / `/demo`. Dev/skipAuth → return DEMO status and do not call Supabase. Otherwise calls make-server-9060b10a (check-card) then either Card Gate (pair) or CardEntry/CardGate UI.
- **card-gate-client.ts:** Builds base URL from `VITE_SUPABASE_PROJECT_ID`, uses `VITE_SUPABASE_ANON_KEY` for unauthenticated calls. After pair, uses in-memory access token + `credentials: 'include'` for cookie. Exposes `getCardToken`, `loadChampItems`, `postInscription`, journal, trace, etc. Offline: queue in localStorage, show OFFLINE_MESSAGE.
- **card-gate-map-client.ts:** Map-specific Gate calls (e.g. postInscription with `opt_in_field`), getMapState, proofs, segments.

### 3.4 Le Champ Data Flow

- **Read:** `ChampScreen` calls `loadChampItems(cardId)` from card-gate-client → Card Gate `GET /champ/items` (requires valid JWT). Backend returns inscriptions with `opt_in_field = true` (e.g. last 7 days), formatted as `FieldItem[]` (id, arrondissement, textExcerpt, timeLabel, etc.). Dots on map are placed by arrondissement via `ChampMapSection` (fixed centers per arrondissement).
- **Write:** User writes an inscription in Ma Carte and checks “Partager au Champ”; client sends `POST /inscriptions` with `opt_in_field: true`. No write is done on the Champ screen itself.

---

## 4. Technical Decisions & Constraints

- **No email auth:** Card-only identity; password is chosen at first activation and is not recoverable (lost card = lost access).
- **Credentials mode:** All Card Gate requests that need cookies use `credentials: 'include'`, hence the need for a non-wildcard CORS origin. This is why Supabase’s `*` breaks production.
- **Env vars:** Only `VITE_SUPABASE_PROJECT_ID` and `VITE_SUPABASE_ANON_KEY` are required in frontend. They are set in Vercel; local `.env` for dev. No secrets in repo.
- **Private repo + LICENSE:** Code is proprietary; sharing by link is the site URL with `/demo`, not the repo.

---

## 5. What Is Next (Recommended Order)

1. **Supabase CORS:** Wait for support or platform fix; or consider workarounds (e.g. proxy that sets correct CORS, or temporary auth path that doesn’t rely on credentials — doc: `docs/OPTIONS_WHILE_WAITING.md`).
2. **Verify map in production:** After next Vercel deploy, confirm Le Champ map and subtitle/title render correctly at `/demo#champ`.
3. **Partner preview (optional):** Static or token-based “Partner Preview” (no full auth) for outreach; see earlier discussion in session.
4. **i18n and UX:** Finish any remaining FR/EN strings; clarify “Le Seuil” (quiz vs études) and Origine/Histoire placement if needed.
5. **Stubs:** Document or hide Sceller, Codex, audio placeholders, etc., per PRE_LAUNCH_CHECKLIST.

---

## 6. File / Folder Quick Reference

| Path | Role |
|------|------|
| `src/App.tsx` | Root: app state, dev bypass, hash routing, screen render. |
| `src/utils/supabase/info.tsx` | Exports projectId & publicAnonKey from env. |
| `src/utils/card-service.ts` | initializeCard, dev/skipAuth, DEMO. |
| `src/utils/card-gate-client.ts` | Card Gate HTTP (pair, refresh, loadChampItems, journal, trace, etc.). |
| `src/utils/card-gate-map-client.ts` | Map/inscriptions/proofs/segments via Card Gate. |
| `src/components/ChampScreen.tsx` | Le Champ page; fetches items or skips in dev. |
| `src/components/ChampMapSection.tsx` | Wraps CarteInteractive + dot overlay for champ items. |
| `src/components/CarteInteractive.tsx` | Paris SVG map (draw/heartbeat/static). |
| `src/components/PersonalMemoryMap.tsx` | Ma Carte; “Partager au Champ” checkbox. |
| `src/locales/{fr,en}/champ.json` | Title and placeholder for Le Champ. |
| `supabase/functions/card-gate/index.tsx` | Card Gate Edge Function (Hono). |
| `supabase/functions/make-server-9060b10a/index.tsx` | check-card, activate-card, login-card. |
| `docs/BYPASS_AUTH_FOR_DEVELOPMENT.md` | Dev/skipAuth and DEMO usage. |
| `docs/LE_CHAMP_EXPLANATION.md` | How Le Champ and sharing work. |
| `docs/POURQUOI_CA_NE_MARCHE_PAS.md` | Why CORS blocks production auth (Supabase gateway). |

---

## 7. For Another AI / Second Opinion

Use this section to get a focused review or suggestions.

### 7.1 Questions for Review

1. **CORS:** Given that Supabase’s gateway appears to inject `Access-Control-Allow-Origin: *` on OPTIONS (and possibly responses), what would you recommend as the next concrete step (e.g. proxy, different auth flow, or platform config) that keeps our security model (httpOnly cookie + credentials)?
2. **Le Champ:** Is the current data model (inscriptions with `opt_in_field`, last 7 days, anonymous) sufficient for a “shared traces of the city” product, or would you add expiry, moderation, or caps?
3. **Dev bypass:** Is the current `/demo` / `/demo` approach the right level of bypass (no Card Gate at all), or would you add a “demo token” or mock data for Champ/aura?
4. **Security:** With repo private, LICENSE in place, and secrets only in env, what would you add or change before sharing the **site URL** (with `/demo`) by email to partners?
5. **Next features:** What would you prioritize after CORS is resolved: full E2E auth test, Partner Preview site, or i18n/UX polish?

### 7.2 What to Hand to Another AI

- This document (`docs/FULL_SPEC_AND_TECHNICALITY.md`).
- Optional: `docs/PRE_LAUNCH_CHECKLIST.md`, `docs/POURQUOI_CA_NE_MARCHE_PAS.md`, `docs/BYPASS_AUTH_FOR_DEVELOPMENT.md`, `docs/LE_CHAMP_EXPLANATION.md`.
- Optional: `src/App.tsx` (routing + dev bypass), `src/components/ChampScreen.tsx`, `src/utils/card-gate-client.ts` (first ~100 lines).

No need to send the full repo; the spec and these files are enough for an opinion on architecture, security, and next steps.
