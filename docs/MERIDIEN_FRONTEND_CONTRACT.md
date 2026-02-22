# Méridien instrument — what the frontend must do to honor it

This is the contract for any UI that drives or displays the Méridien instrument (alignment / EGARE–PROCHE–SUR_LIGNE–ALIGNE). The backend does not compute alignment; the frontend does. To honor the instrument and keep behavior robust:

---

## 1. Inputs you must provide

- **Position:** `lat`, `lng` from geolocation (e.g. `watchPosition` / `getCurrentPosition`).
- **Accuracy:** `accuracy_m` from `pos.coords.accuracy` (meters). **Required for the confidence gate.** If you never pass it, the instrument will always show "signal low" (EGARE).
- **Heading (optional):** `pos.coords.heading` (degrees 0–360). Used only for the "aligned" state when heading is stable.

---

## 2. Confidence gate (mandatory)

- **Rule:** If `accuracy_m` is **missing** or **> 40 m**, do **not** compute alignment. Show the same state as "no GPS": EGARE, alignmentIndex 0, holdProgress01 0 and a short hint (no numbers).
- **Constants:** `ACCURACY_OK_M = 40`, `ACCURACY_GOOD_M = 25` in `src/utils/meridien-geo.ts`. Use `isAccuracySufficient(accuracy_m)` and `computeMeridienSignalQuality(...)` from that module.
- **Signal quality:** `MeridienSignalQuality = 'good' | 'unstable' | 'low' | 'out_of_coverage'`. Only when `quality === 'good'` output alignment state; otherwise EGARE + hint (e.g. "Signal faible — reste immobile 3 secondes.", "Trop de mouvement — ralentis.", "Hors champ — Paris seulement.").
- **Why:** Poor accuracy makes "near / on line / aligned" misleading. The instrument must not claim alignment when the reading is unreliable.

---

## 3. Smoothing (recommended)

- **Rule:** Feed **smoothed** lat/lng into alignment and nearest-threshold logic when accuracy is acceptable. Use EMA only when `accuracy_m ≤ 60`; otherwise do not smooth ("smooth garbage").
- **Constants:** `MERIDIEN_EMA_ALPHA = 0.25`, `MAX_ACCURACY_FOR_SMOOTHING_M = 60`, `SAMPLE_BUFFER_MAX = 30` in `meridien-geo.ts`.
- **Why:** Raw GPS jitters; smoothing keeps the needle and "Lire" threshold from flickering. Capping the buffer avoids unbounded history.

---

## 4. Heading only when stable (optional)

- **Rule:** Use heading to promote to "aligned" only when accuracy is good **and** recent headings are stable (e.g. variance of last 8 readings ≤ 25°). Use `isHeadingStable(headings.slice(-8), MERIDIEN_HEADING_STABLE_MAX_VARIANCE_DEG)` and pass `useHeadingForAligned` into `getMeridienState` only when signal quality is good.
- **Constants:** `MERIDIEN_HEADING_SAMPLES_FOR_STABILITY = 8`, `MERIDIEN_HEADING_STABLE_MAX_VARIANCE_DEG = 25`.
- **Why:** Unstable heading (e.g. indoors) would flip aligned/on_line; ignoring it keeps the state coherent.

---

## 5. No dead ends (mandatory)

- **Rule:** The Meridian state object passed to the instrument UI must **always** be a valid shape (state, alignmentIndex, holdProgress01, recognized, nearestPlaceId, micro). Never pass `undefined` or throw on missing GPS/heading. **Never output a wrong meridian reading:** when quality is not `good`, output EGARE and set `micro.statusLine` to the hint (no numbers).
- **MeridienLiveReading:** Same public fields as local state, plus `quality: MeridienSignalQuality` and optional `hint`. Use `computeMeridienSignalQuality(accuracy_m, positionBuffer, headings, inParis)` and stillness window 2.0–3.0 s.
- **Fallback:** When there is no position, or quality is not good, or coords are outside the Paris bbox, return fallback: state EGARE, alignmentIndex 0, holdProgress01 0, recognized all NON_RECONNU, nearestPlaceId null, micro.statusLine = hint.

---

## 6. Out-of-coverage (optional)

- **Rule:** If lat/lng are outside a generous Paris bbox, treat as "signal low" and show EGARE. Use `inParisBbox(lat, lng)` from `meridien-geo.ts`. Do **not** make the instrument depend on zone/territory APIs.

---

## 7. Privacy

- Do not log or persist raw lat/lon. No new tables; no sending of raw coordinates beyond what the app already does (e.g. proof submission with radius).

---

## Summary checklist for the frontend

| Requirement              | Mandatory? | Where |
|--------------------------|------------|--------|
| Pass `accuracy_m`        | Yes        | From `GeolocationPosition.coords.accuracy` |
| Gate on accuracy ≤ 40 m  | Yes        | `ACCURACY_OK_M`, `computeMeridienSignalQuality` → else EGARE + hint |
| Quality + hint           | Yes        | `quality: good \| unstable \| low \| out_of_coverage`, `micro.statusLine` = hint (no numbers) |
| Use smoothed lat/lng     | Recommended| `emaPoint` only when `accuracy_m ≤ 60`; cap buffer at 30 |
| Stillness 2–3 s          | Recommended| `isStill(positionBuffer, STILLNESS_WINDOW_MS)` for unstable vs good |
| Use heading only if stable | Optional | `isHeadingStable(last 8, 25°)` when quality good |
| Always valid state object| Yes        | Fallback = EGARE, 0, 0, … + hint |
| Out-of-bbox → out_of_coverage | Optional | `inParisBbox(lat, lng)` → hint "Hors champ — Paris seulement." |
| No raw lat/lon storage   | Yes        | No new persistence |

All helpers and constants live in **`src/utils/meridien-geo.ts`**. The main screen that honors this contract is **`src/components/MeridiensLive.tsx`**.
