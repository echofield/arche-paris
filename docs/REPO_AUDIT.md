# ARCHÉ (petit souvenir) — Full Repository Audit

**Date:** 2025-02  

**Périmètre (audit complet) :** architecture, duplication, performance risks, unused state, and data flow inconsistencies.

---

## 1. Architecture

### 1.1 Entry points and boot

| Layer | Path | Role |
|-------|------|------|
| HTML | `index.html` | Root div, loads `/src/main.tsx` as module; PWA manifest; Google Fonts (Cormorant Garamond, Inter). |
| React root | `src/main.tsx` | `createRoot` → `ErrorBoundary` → `App`; imports `index.css`, `viewport.css`, `styles/globals.css`; registers service worker `/sw.js`. |
| SPA root | `src/App.tsx` | Single SPA: screen state, card flow, hash routing. No React Router. |

### 1.2 Routing

- **Hash-only:** `window.location.hash` + `hashchange` in `App.tsx` (lines 281–346).
- `navigateTo(screen, queteId?)` sets `window.location.hash` (e.g. `#collection`, `#quete/…`, `#quest-run/…`, `#tresor`).
- No router library; all routes handled in one `handleHashChange`.

### 1.3 State

- **Global (App):** `appState`, `cardStatus`, `currentScreen`, `selectedQueteId`, `questRunId`, `showSilencePrompt`, `cabinetOpen`, force-unpair modal state.
- **Contexts:**
  - `LanguageProvider` (`src/utils/i18n.tsx`) — locale, `useTranslation`, `t`, `tArray`.
  - `SyncStateProvider` (`src/contexts/SyncStateContext.tsx`) — pending writes count, `isSyncing`, `lastSyncAt`, `lastError`, `showCompressedMessage`, `flushNow(cardId)`.
  - `WhisperProvider` (`src/contexts/WhisperContext.tsx`) — whisper UI state.
- No Redux/Zustand; no formal store.

### 1.4 Backend and API

| System | Role |
|--------|------|
| **Supabase** | `src/utils/supabase/client.ts`; used by `lib/api.ts` (session, `supabase.functions.invoke`), inscriptions, ActivationPage, Codex, PathwaysMap, HistoireQuotidienne. |
| **Card Gate** | Primary data path. Client: `src/utils/card-gate-client.ts` (token in memory, httpOnly cookies). Requests via `src/lib/api.ts` → `invokeCardGateRequest` to `/api/card-gate/${path}`. Service: `src/utils/card-service.ts` (init, pair, unpair, `getStoredCard`). |
| **Vercel** | `vercel.json` rewrites `/api/card-gate/:path*`; handler `api/card-gate/index.js` (or `api/card-gate/[...path].js`) proxies to Supabase Edge `card-gate`. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. |

#### 1.4.1 Decision: invoke() vs Card Gate

- **Use `invokeCardGateRequest`** (and thus `/api/card-gate/${path}`) for everything the single Edge Function `card-gate` serves: world/snapshot, zone-progress, zone-consciousness, presence/pulse, law/evaluate, journal/traces proxy, etc. Session comes from `getSessionCardCode()` in card-gate-client; token is sent via cookies by the proxy.
- **Use `invoke(fn, body)`** (Supabase `functions.invoke`) only for discrete Edge Functions called by name (e.g. `zones-enter`, `rituals-start`, `inscriptions-create`) when the backend routes them as separate functions. The client still sends `X-ARCHE-CARD-CODE` from `getSessionCardCode()` when `includeCardHeader` is true.
- **Do not** introduce a third path (e.g. direct fetch to a different URL) for card lifecycle or data that belongs behind Card Gate. Exceptions must be documented here.

**Examples:** `api.worldSnapshot()` → invokeCardGate; `api.zonesEnter()` → invoke('zones-enter', body).

#### 1.4.2 Contract delta (AUDIT 2025-02-23)

- **placeScan:** Types in `api.ts` are aligned with place-scan Edge and `docs/PLACE_SCAN_FRONTEND_CONTRACT.md`. No delta. Runtime guard `isPlaceScanResult()` added for optional validation.
- **zoneProgress:** Card Gate `GET /zone-progress` returns `{ ok: true, zones, stats, complexion }`. `ZoneProgressData` updated with optional `ok?: true`; `isZoneProgressData()` guard added. No breaking change for consumers.

#### 1.4.3 cardId convention

- **Convention:** `CardId = string | null`. Use **null** when the card is unknown or not set; do not use the string `'unknown'` as a sentinel.
- **At boundaries:** Use `normalizeCardId(value)` from `card-service` to coerce `undefined` / `'unknown'` to `null`. Components receive `cardId: string | null`; type is exported from `shared/types` as `CardId`.

### 1.5 Top-level modules

| Area | Location | Notes |
|------|----------|--------|
| Screens / flows | `src/components/` | HomepageV1, QuetesV1, QueteDetail, QuestRun, CarnetParisien, PersonalMemoryMap, ArcheInterface, ChampScreen, MeridiensLive, TresorCache, etc. |
| API & types | `src/lib/api.ts` | Card Gate + Supabase invoke wrapper; `api.*` methods; shared types (e.g. `WorldSnapshotData`, `ZoneProgressItem`, `MonParisReading`). |
| Utils | `src/utils/` | card-service, card-gate-client, card-gate-map-client, journal-sync, traces-service, companion-service, i18n, echo-milestone-runner, silence-prompt, engrave-events, quest-run-service, walk-service, map-project, inscriptions-service, etc. |
| UI primitives | `src/components/ui/` | Radix-based (sheet, dialog, sidebar, carousel, etc.). |
| Locales | `src/locales/` + i18n | fr/en (map, church, etc.); `useTranslation`, `t`. |
| Edge / API | `supabase/functions/` | `card-gate/`, `zone-consciousness`, rituals, inscriptions, decision-made, etc.; shared `_shared/auth.ts`, `validation.ts`, `cors.ts`, `event-writer.ts`. |

**CORS (Edge Functions):** All deployable functions either use `_shared/cors.ts` and handle `OPTIONS` at the start of the handler (place-scan, zone-consciousness, rituals, inscriptions, etc.) or implement their own CORS (card-gate, make-server). No project-level CORS for Functions in dashboard — in-code only. See `docs/SUPABASE_AGENT_PROMPT_PLACE_SCAN_CORS.md` and `docs/SECRETS_RUNBOOK.md` for `CORS_ORIGIN`.

### 1.6 Boundaries and dependencies

- **No full dependency-graph run.** No obvious circular imports.
- **Boundaries:** `lib/api.ts` imports Supabase client and defines Card Gate fetch; `card-service` → `card-gate-client`; components use both `card-service` and `card-gate-client` / `card-gate-map-client`.
- **Note:** `src/utils/codex-helpers.ts` has commented-out `inscribeCodexEntry` from `./supabase/client` (“TEMPORAIRE”).

### 1.7 Presence flow (AUDIT 2025-02-23)

State transitions that affect “I am here” (seal, unlock, progression, “Lire”) must go through **verify()** and a confidence grade (e.g. MED for soft confirmation, HIGH for seal). Do not trust raw position for these. Single source of truth: one presence protocol, no alternate GPS paradigm in production.

**Sequence (conceptual):** User → UI → presence layer (e.g. `verify()`) → card-gate-client / Edge function → DB/RLS → (optional) Realtime → UI sync. Smoothing and “you are here” dot may use `watchPosition` for feel; **state changes** (threshold, crossing, proof) go through the presence layer. See `docs/DESIGN_PHILOSOPHY.md` (§3 One source of truth for “I am here”).

### 1.8 Design philosophy checks

- **No raw coordinates/accuracy in production UI:** Grep for `lat`, `lng`, `latitude`, `longitude`, `accuracy` in rendered strings (JSX/text). If any appear, guard behind a non-production flag or replace with a single i18n “witness” line per DESIGN_PHILOSOPHY.
- **Server:** Confirm no new raw location persistence beyond what the product already needs (e.g. proof with radius, place-scan request). See DESIGN_PHILOSOPHY §5 Privacy by default.

---

## 2. Duplication

### 2.1 Similar components

- **Sheet UIs:** Same pattern in several places: `Sheet` + `SheetContent` + `SheetHeader` + `SheetTitle` with repeated style `style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A' }}` in:
  - `PersonalMemoryMap.tsx` (écrire sheet),
  - `ZoneDetailSheet.tsx`,
  - `ChampScreen.tsx`.  
  **Recommendation:** One shared “content sheet” wrapper (e.g. `ArcheSheet`) with this title style.

- **Card concepts:** Multiple meanings of “card”:
  - **Flow:** `CardEntry`, `CardGate`, `CardDrawer` (physical card activation / pairing).
  - **Content:** `ReadingCard` (Mon Paris), `QueteCard`, `LangagesCard`, `SectorCard`, `LessonCard`, `InscriptionCard`, `GameCard`.  
  No shared base component; naming is consistent but implementations are independent.

### 2.2 Copy-pasted API and auth patterns

- **Card identity for requests:** Two ways to get “current card” for API:
  - `getRuntimeCardCode()` in `lib/api.ts` — reads `localStorage.getItem('arche_card_session')`, parses `code` / `card_id`.
  - `getSessionCardCode()` in `card-gate-client.ts` — same storage key and parsing.  
  **Recommendation:** Single helper (e.g. in `card-gate-client`) and use it from `api.ts` to avoid drift.

- **Error handling:** Repeated `result.error` / `result.data` checks and string messages (e.g. `result.error?.includes('429')`) in `PersonalMemoryMap.tsx`, `AuraPage.tsx`; similar `result.error || '…'` in `RitualRunner`, `ZoneDetailSheet`, etc. Consider a small `getApiErrorMessage(result)` or shared error UI.

### 2.3 Repeated styles / constants

- Sheet title style (see above) repeated in three files.
- Inline styles for loading, fixed positioning, and colors could be centralized (design tokens or shared components).

### 2.4 Logic duplication

- **Hash routing:** In `App.tsx` `handleHashChange`, the branch `hash === 'etudes'` appears **twice** (lines 297 and 303); the second branch is unreachable. Remove the duplicate.
- **Card code/session:** Same “read session from localStorage” logic in `getRuntimeCardCode()` and `getSessionCardCode()` (see above).

---

## 3. Performance risks

### 3.1 Bundles and heavy imports

- **Motion:** Two libraries in use:
  - `framer-motion` — App.tsx (`AnimatePresence`), OrigineMap, InstrumentReadingLayer, MeridiensInterface, ArcheInterface, InstrumentsCabinetOverlay.
  - `motion/react` — TresorCache.  
  **Risk:** Larger bundle and two APIs. Prefer a single motion library and migrate TresorCache or the rest accordingly.

- **Radix:** Many `@radix-ui/*` packages; only some may be on hot paths. Worth checking tree-shake and actual usage.

- **Lazy loading:** Only `MeridiensLive` and `EtudesHub` are lazy-loaded. Heavier screens (PersonalMemoryMap, CarnetParisien, ArcheInterface, ChampScreen, etc.) are static imports and can increase initial bundle and TTI.

### 3.2 Re-renders

- **SyncStateContext:** Value is a new object every render (`{ pendingCount, isSyncing, lastSyncAt, lastError, showCompressedMessage, flushNow }`). Any consumer re-renders when any of these change. Acceptable if few consumers; consider splitting or memoizing context value if many components subscribe.

- **App.tsx:** Single `useEffect` for hash routing with empty deps; `handleHashChange` closes over many setters. One listener; impact likely small.

- **HomepageV1:** `loadSnapshot()` called without a loading flag; component can render with null then update (no explicit loading guard).

### 3.3 Memoization and lists

- **PersonalMemoryMap:** Heavy `useMemo`/`useCallback`; some lists (e.g. `tracesV1.slice(0, 10).map`, `todaySummary.entries.slice(0, 3).map`, `inscriptionsForArr.map`) create new elements each render; list item components are not wrapped in `React.memo`.
- **CarnetParisien:** `souvenirs.map` in render; no memo on list or item.
- **CollectionMap / PersonalMemoryMap:** Many `.map()` over symbols/runs/nodes; no virtualization.

### 3.4 Heavy work on mount and in callbacks

- **PersonalMemoryMap:** Multiple `useEffect`s (zone progress, note, refreshMapState, geolocation, presence pulse); `refreshMapState` calls `api.worldSnapshot` and updates large state. No explicit debounce on refresh.
- **ArcheInterface:** `setInterval` for drift and animation frame loop when mounted — always running.

### 3.5 Large lists without virtualization

- **CarnetParisien:** `souvenirs.map` — list can grow; no `react-window`/`react-virtual` (not in deps).
- **PersonalMemoryMap:** Traces, today summary entries, inscriptions — sliced (e.g. 10, 3) but full lists still built; no virtualization.
- **ChampScreen, Traces, ZoneDetailSheet:** List-like content without virtualization; acceptable if lists stay small; monitor if they grow.

---

## 4. Unused state and dead code

### 4.1 Unused / redundant state

- **App.tsx:** `CollectionMap` is **imported but never rendered**. Route `#collection` renders `PersonalMemoryMap`, not `CollectionMap`. So `CollectionMap` is dead from App’s perspective (or legacy). Either remove the import and use `CollectionMap` somewhere, or delete the component if obsolete.

- **WhisperContext:** `show` is used; `state` is read by `Whisper`. No obvious unused state.

- **SyncStateContext:** Exported fields appear consumed (e.g. CarnetParisien uses `pendingCount`, `flushNow`, `showCompressedMessage`).

### 4.2 Unused props

- No full “prop never read” scan. Several components receive `cardId` and pass it to services; assume used downstream.

### 4.3 Dead code

- **utils/codex-helpers.ts:** Commented `// import { inscribeCodexEntry } from './supabase/client';` and TODO “Implémenter quand inscribeCodexEntry sera prête”; `inscribeQuest` only logs.
- **lib/api.ts:** `invoke()` uses `supabase.functions.invoke` with optional `requireUserSession`. All Card Gate usage goes through `invokeCardGateRequest` (fetch to `/api/card-gate/…`). `invoke()` may be legacy or for other Supabase functions only; document or remove if unused.
- **CollectionMap:** See above (imported, not rendered).

---

## 5. Data flow inconsistencies

### 5.1 Same concept, different shapes

- **Card identity:**
  - `cardId` is a string everywhere (e.g. `CardStatus.cardId`, `getStoredCard()`).
  - In `lib/api.ts`, `getRuntimeCardCode()` returns a *code* (from URL or session); `getStoredCard()` returns stored *card id*. Session object has both `code` and `card_id`. Two sources of “current card” for API (session vs storage) could diverge if one is updated and the other isn’t.

- **Traces:** `traces-service` uses `card_id` in types; components use `cardId` (camelCase). API/types use `card_id`; frontend uses `cardId` — consistent at boundaries but keep types aligned.

### 5.2 API vs frontend types

- `lib/api.ts` defines interfaces (e.g. `WorldSnapshotData`, `ZoneProgressItem`, `MonParisReading`). No audit of Supabase/card-gate response shapes vs these types; treat `api.ts` as source of truth. New endpoints should match or extend these explicitly.

### 5.3 Sources of truth / sync

- **Card:** `localStorage` `arche_card_id` (card-service) vs session `arche_card_session` (code/card_id). Session is set after Card Gate auth; storage in same flow. If session expires and storage remains, `getStoredCard()` still returns id; `getSessionCardCode()` may be null — documented (e.g. SESSION_EXPIRED) but two sources.
- **Pending writes:** SyncStateContext + card-gate-client queue; on reconnect, context calls `flushPendingWrites` for each pending card. Single source for queue; UI and flush aligned.

### 5.4 Missing error / loading states

- **HomepageV1:** `loadSnapshot()` called; no loading flag or error state for `worldSnapshot`. UI can show empty or stale until data arrives.
- **PersonalMemoryMap:** `refreshMapState()` keeps previous state on error (e.g. 401); user may not see explicit “error” or “retry” for snapshot.
- **Async flows:** Some screens have `isLoading`/`loading` (CarnetParisien, Traces, ChampScreen, ZoneDetailSheet, ChurchQuestRun); others (e.g. HomepageV1 snapshot, initial map load in PersonalMemoryMap) do not expose loading state.

### 5.5 Inconsistent card id fallback

- App passes:
  - `cardId={cardStatus?.cardId ?? null}` in some places (HomepageV1, QuetesV1, LivingQuest, PersonalMemoryMap, MeridiensLive),
  - `cardId={cardStatus?.cardId || 'unknown'}` in others (CarnetParisien, PersonalMemoryMap, ChampScreen).  
- **Risk:** Children may treat “no card” vs “unknown” differently; can lead to subtle bugs. Standardize on one convention (e.g. `null` for “no card” and handle in children, or a single sentinel).

---

## 6. Summary table

| Area | Finding |
|------|--------|
| **Entry** | `index.html` → `main.tsx` → `App.tsx`; hash routing only. |
| **State** | App local state + 3 contexts (Language, SyncState, Whisper). |
| **Backend** | Supabase client + Edge Functions; Card Gate via `card-gate-client` + Vercel proxy. |
| **Duplication** | Sheet title style ×3; `hash === 'etudes'` twice (remove duplicate); getRuntimeCardCode vs getSessionCardCode. |
| **Dead code** | `CollectionMap` imported but not rendered; codex-helpers `inscribeQuest` stub. |
| **Motion** | Both `framer-motion` and `motion/react` — unify to one. |
| **Memo/virtualization** | No list virtualization; many `.map()` without `React.memo` on items. |
| **Data flow** | cardId: `?? null` vs `|| 'unknown'`; two “current card” sources (session vs storage). |
| **Loading/error** | HomepageV1 and some map flows lack explicit loading/error UI. |

---

## 7. Recommended next steps (priority)

1. **Quick wins:** Remove duplicate `hash === 'etudes'` in `App.tsx`; resolve or remove unused `CollectionMap` import; centralize `getRuntimeCardCode`/`getSessionCardCode`.
2. **Consistency:** Unify `cardId` prop convention (`null` vs `'unknown'`); add shared sheet title component or design token.
3. **Performance:** Standardize on one motion library; consider lazy-loading more heavy screens; add loading/error states for HomepageV1 and map snapshot.
4. **Maintainability:** Document when to use `invoke()` vs `invokeCardGateRequest`; align codex-helpers with real backend or remove stub.
