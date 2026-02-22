# Méridien hardening — diff plan

## Code path (mapped)

- **Frontend**
  - **Inputs:** `GeolocationPosition` → `lat`, `lng`, `heading`; **accuracy not currently used.**
  - **Entry:** `MeridiensLive.tsx` (geometric view), `MeridianQuest.tsx` (perception), `usePerceptionState` (drift/conflict).
  - **Core logic:** `src/utils/meridien-geo.ts` — `getMeridienState(lat, lng, heading?)`, `distanceToMeridianMeters(lng)`, `getNearestThreshold(lat, lng)`.
  - **Output states:** `MeridienState` = `'lost' | 'near' | 'on_line' | 'aligned'`; mapped to `LocalMeridianState.state` = `'EGARE' | 'PROCHE' | 'SUR_LIGNE' | 'ALIGNE'` for `MeridiensInterface`.
- **Edge:** No edge function for alignment. Card-gate `POST /proofs/meridiens` is for submitting proofs only.

## Files to change

| File | Changes |
|------|--------|
| `src/utils/meridien-geo.ts` | Add accuracy threshold constant and `isAccuracySufficient()`; add `emaPoint()` for smoothing; add `isHeadingStable()` helper; guard `getMeridienState()` and `getNearestThreshold()` against non-finite coords; optional `inParisBbox()` for out-of-coverage. |
| `src/components/MeridiensLive.tsx` | Capture `accuracy_m` from `GeolocationPosition`; maintain EMA-smoothed position (ref + update in watchPosition); apply confidence gate (if !accuracy sufficient → use fallback state object); optional heading stability (only use heading for aligned when stable); ensure every code path returns a valid meridian state object; optional Paris bbox → EGARE when outside. |

## New types / constants (no UI copy changes)

- **Constants (meridien-geo or design/motion):**
  - `MERIDIEN_ACCURACY_THRESHOLD_M = 50` — above this we do not compute alignment (signal low / hold still).
  - `MERIDIEN_EMA_ALPHA = 0.25` — smoothing factor for lat/lng (e.g. 0.2–0.35).
  - `MERIDIEN_HEADING_STABLE_MAX_VARIANCE_DEG = 25` — ignore heading for “aligned” unless recent headings are stable within this.
- **Helpers:**
  - `isAccuracySufficient(accuracy_m: number | null | undefined): boolean`
  - `emaPoint(prev: { lat, lng } | null, next: { lat, lng }, alpha: number): { lat, lng }`
  - `isHeadingStable(headings: number[], maxVarianceDeg: number): boolean` (optional; e.g. last 5 headings)
  - `inParisBbox(lat: number, lng: number): boolean` (optional; generous Paris bbox, no zone dependency)

## Invariants

- **Confidence gate:** If `accuracy_m` is missing or `> MERIDIEN_ACCURACY_THRESHOLD_M`, do not compute alignment; use same fallback as “no GPS” (state EGARE, alignmentIndex 0, holdProgress01 0).
- **Smoothing:** Use EMA-smoothed lat/lng for `getMeridienState` and `getNearestThreshold` (and for snapshot fetch deadband) to reduce jitter.
- **Heading:** Use heading for “aligned” only when `isHeadingStable` is true (optional).
- **No dead ends:** Meridian state is always a valid `LocalMeridianState`-shaped object; no throws, no undefined state; non-finite coords → fallback.
- **Optional out-of-coverage:** If `!inParisBbox(lat, lng)` → treat as EGARE; no dependency on zone/territory resolver.
- **Privacy:** No new tables; no persistence of raw lat/lon.

## UI

- No new copy; no change to `MeridiensInterface` labels or locale keys. “Signal low” = existing EGARE fallback (instrument seeking axis / lost).

## Local verification steps

1. **Build**
   ```bash
   npm run build
   ```
   Must complete successfully (verified).

2. **Unit tests**
   No Méridien-specific test script in this repo. Existing tests (`tests/*.test.ts`) do not cover meridien-geo; run manually if added later.

3. **Manual**
   - Open `#meridiens` with high-accuracy GPS → alignment states (near / on_line / aligned) when appropriate.
   - With location off or very poor accuracy → instrument shows EGARE (no crash).
   - With device stationary, smoothed position should reduce jitter vs raw GPS.
