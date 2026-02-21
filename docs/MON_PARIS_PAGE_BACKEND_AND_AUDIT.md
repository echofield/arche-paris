# Mon Paris — Backend Flow, Frontend Summary & Audit

Context document for frontend updates. Describes the **Mon Paris** (Ma Carte / collection) page: backend data flow, what the frontend does today, and what is under-exploited.

---

## 1. Page identity

- **Route:** `#collection` → `PersonalMemoryMap` (full screen).
- **Entry:** Homepage → "Ma carte" / "Mon Paris" → `navigateTo('collection')`.
- **Key file:** `src/components/PersonalMemoryMap.tsx` (~1670 lines). Subcomponents: `MapLayers`, `TraceRenderer`, `ZoneOverlay`, `ZoneDetailSheet`; data from `collection-service`, `api`, `trace-service`, journal, map-engraving.

---

## 2. Backend / data flow (structure)

### 2.1 Data sources (high level)

| Source | Type | Used for |
|--------|------|----------|
| **collection-service** (local) | `getCollection()` → `Collection` | Collected symbols (pins), count X/28, points on map, visited vs unvisited arrondissements |
| **api.zoneProgress()** (Card Gate) | `ZoneProgressData` | Zone states (entered, rituals, engraved, custodian), zone detail sheet, ritual unlock |
| **api.worldSnapshot()** (Card Gate) | `WorldSnapshotData` | Inscriptions, city signals (LA VILLE), zone law (`ritual.start`), anchors, encounter (character), optional aura/passport/fund |
| **api.presencePulse()** (Card Gate) | POST presence | Live position heartbeat; triggers snapshot refresh when stale |
| **trace-service** (local) | `listTraces()`, `loadTracesV1()` | Quest walks, threads; "MES TRACES" layer |
| **refused-arrondissements** (local) | `getRefusedArrondissements()`, `setRefused()` | "ABSENCE" list: arrondissements user marked as intentional non-visit |
| **journal / card-gate-map** | Notes, inscriptions | My Paris note (Carnet link); Écrire (graver) → `postInscription` / Card Gate |
| **SYMBOLS** (static) | `src/data/symbols.ts` | 28 symbols; total count, positions, arrondissement |

### 2.2 Flow (sequence)

1. **Mount**
   - `getCollection()` → `collectedCount` / `totalCount` (X/28), `points` for map.
   - `api.zoneProgress()` → `zoneProgressMap`, `zoneLawMap` (ritual rules).
   - If card has secret: `refreshMapState()` → `api.worldSnapshot({ include: 'map,champ,law', h3_center: 'PAR-10', k: 10 })` → `applySnapshot()`:
     - `mapState` (inscriptions from `world.map.inscriptions`), `cityMapState` (zones with `signals`: inscriptions_recent, champ_recent, whisper), zone law & anchors.
   - `loadMyParisNote(cardId)` for the persistent note.

2. **Layers (tabs)**
   - **MES TRACES:** Local traces + runs (quest walks); toggles: Threads, Temporal Meridians only, SEGMENTS GRAVÉS, INSCRIPTIONS. Map shows pins, runs, segments/inscriptions from `mapState` when toggles on.
   - **LA VILLE:** City signals from `cityMapState` (strength per arrondissement); optional encounter from `worldSnapshotState.me.character`.
   - **MOMENTS (Rituels):** Zone overlay from `zoneProgressMap` / `zoneLawMap`: unexplored (grey) / entered (gold) / sealed (green).

3. **GPS**
   - `watchPosition` → presence marker; when moved enough, `api.presencePulse({ h3, ts, speed_mps, accuracy_m })`; on success, refresh snapshot if >60s old. `applySnapshot` can show "Votre présence commence à compter" and zone whisper.

4. **ABSENCE (bottom)**
   - `unvisitedArrondissements` = arrondissements with 0 collected symbols. Shown as tappable list (1e–20e). Tap → "Tu n'as pas marché ici. Est-ce un choix ?" → Oui → `setRefused(arr)` (hidden from list); Non → close.

5. **Zone detail**
   - Tap zone on map → `ZoneDetailSheet` (arrondissement). Uses `zoneProgressMap`, `zoneLawMap`; can open "Écrire" (inscription sheet). On close, `api.zoneProgress()` again.

6. **Écrire (inscription)**
   - Draft text (Rue X — HH:MM + 80–120 words) → `postInscription` (Card Gate). On success, `refreshMapState()` and journal append.

7. **Share / Notebook**
   - Share: copy `#collection` link. "Dans ton carnet" → `onOpenNotebook()` (Carnet).

### 2.3 Backend endpoints (Card Gate / Supabase)

- `GET zone-progress` → zone list + stats (rituals, engravings, custodians).
- `GET world/snapshot?include=map,champ,law&h3_center=PAR-10&k=10` → world zones, map inscriptions, champ, law, `me.zones`, `me.character`, optional `me.aura` / passport / fund.
- `POST presence/pulse` → heartbeat for current H3.
- Inscriptions: Card Gate map API (`postInscription` in `card-gate-map-client`).

### 2.4 Types (reference)

- **Map state:** `src/types/map-engraving.ts` — `MapState` (inscriptions, segments, meridian_proofs), `CityMapState` (arrondissement signals).
- **API:** `src/lib/api.ts` — `ZoneProgressItem`, `ZoneProgressData`, `WorldSnapshotData`, `WorldZoneSnapshot`, etc.
- **Collection:** `src/utils/collection-service.ts` — `Collection`, `CollectedSymbol`.

---

## 3. Frontend (what exists)

- **Header:** Title "Mon Paris", subtitle `collectedCount / totalCount` + "symboles" (e.g. 0/28 symboles). Back button (`onBack` → homepage).
- **Tabs:** MES TRACES | LA VILLE | MOMENTS (MapLayers); only one active; MOMENTS shows legend (Inexploré / Entre / Scellé).
- **Filters (MES TRACES only):** Pills: Threads, Temporal Meridians only, SEGMENTS GRAVÉS, INSCRIPTIONS (toggle visibility on map).
- **Map:** Paris SVG; markers from collection pins, ZoneOverlay (ritual state), TraceRenderer (traces, segments, inscriptions), presence marker ("Vous êtes ici") when GPS allowed; tagline "Marchez. La ville se révèle."
- **Instrument reading layer (overlay):** Three states — quiet (tappable lieu marks on map), reading (glow on selected lieu), interpretation (one poetic line at bottom). Data from `src/data/lieux-paris.ts` (declarative Lieu list). Implemented as `InstrumentReadingLayer`; overlay only, no new routes or layout. Tap a mark → reading → interpretation → auto back to quiet; tap background or same mark → quiet. Uses motion.ts for delays (no setTimeout).
- **ABSENCE:** Section "Absence" with unvisited arrondissements as links; tap → refusal modal; refused list shown as strikethrough.
- **Sheets:** Zone detail (ZoneDetailSheet), Écrire (inscription), refusal modal.
- **Language:** FR/EN via global LanguageSelector; keys in `src/locales/{fr,en}/map.json` (myparis.*, map.tabs.*, map.stats.*, etc.).

Note: A "Quiet" control or "Retour à la cité" label may appear in design/mock; in code, back is `BackButton` and language is global. Any "Quiet" would need to be wired if desired.

---

## 4. Under-exploited (audit summary)

Use this as a checklist for frontend updates.

1. **LA VILLE tab**
   - Backend already returns `cityMapState` (signal strength, inscription counts per arrondissement). The map and list could make "city alive" more visible (e.g. heat, labels, or a short list of "active" arrondissements).

2. **MOMENTS tab**
   - Legend exists (Inexploré / Entre / Scellé) but the tab is underused. Could add short copy, next suggested zone, or link to ritual flow from zone tap.

3. **SEGMENTS GRAVÉS / INSCRIPTIONS toggles**
   - They filter what TraceRenderer shows; impact is subtle. Consider clearer visual feedback (e.g. badge counts, or a short "X segments, Y inscriptions" when toggles are on).

4. **Map markers (pins)**
   - Pins are present; differentiation (e.g. by status: collected vs to-discover, or by type) is minimal. Click-through from pin to symbol detail or zone could be reinforced.

5. **Progress (0/28 symboles)**
   - Single number is correct for "calm" design. Optionally: one next goal line ("Prochain: 5e") or role progression (traveler → guide → hero → guardian) if backend exposes it.

6. **ABSENCE**
   - Purpose ("arrondissements you haven’t collected in — is that a choice?") could be clearer in one line of copy. Refused list is clear; unvisited links could scroll/focus map to arrondissement.

7. **Encounter (LA VILLE)**
   - When `worldSnapshotState.me.character` exists, encounter block is shown. Could be more prominent or linked to a next action (e.g. go to zone, open instrument).

8. **Gamification / feedback**
   - No strong "reward" moment on new symbol or new zone. Optional: light animation or toast on collect, or a rare "Zones: X/20" style line if aligned with Aura.

9. **Quiet / Retour à la cité**
   - If "Quiet" (e.g. sound/mode) or "Retour à la cité" is in the design, it is not implemented in this page; add if desired.

10. **Performance / loading**
    - Snapshot and zone progress are loaded on mount; no skeleton for map or tabs. A light loading state could improve perceived performance.

---

## 5. File map (quick reference)

| Role | Path |
|------|------|
| Page component | `src/components/PersonalMemoryMap.tsx` |
| Tabs + filters | `src/components/PersonalMemoryMap/MapLayers.tsx` |
| Map drawing | `src/components/PersonalMemoryMap/TraceRenderer.tsx`, `ZoneOverlay.tsx` |
| Instrument reading overlay | `src/components/PersonalMemoryMap/InstrumentReadingLayer.tsx` |
| Lieux (instrument data) | `src/data/lieux-paris.ts` |
| Zone sheet | `src/components/ZoneDetailSheet.tsx` |
| Collection (local) | `src/utils/collection-service.ts` |
| Symbols (static) | `src/data/symbols.ts`, `arrondissement-positions.ts` |
| API / types | `src/lib/api.ts`, `src/types/map-engraving.ts` |
| Traces (local) | `src/utils/trace-service.ts` |
| Refused arrondissements | `src/utils/refused-arrondissements.ts` |
| Locales | `src/locales/{fr,en}/map.json` |

---

## 6. Design constraints (from HANDOFF)

- Calm, poetic (e.g. dots ●○); one number (Zones: X/20 or symboles X/28). No dashboards.
- Keep Mon Paris as a "memory map", not a navigation map.

Use this doc as the backend and frontend context when updating the Mon Paris page.
