# Méridien instrument — what the frontend must do to honor it

This is the contract for any UI that drives or displays the Méridien instrument (alignment / EGARE–PROCHE–SUR_LIGNE–ALIGNE). The backend does not compute alignment; the frontend does. To honor the instrument and keep behavior robust:

---

## 1. Inputs you must provide

- **Position:** `lat`, `lng` from geolocation (e.g. `watchPosition` / `getCurrentPosition`).
- **Accuracy:** `accuracy_m` from `pos.coords.accuracy` (meters). **Required for the confidence gate.** If you never pass it, the instrument will always show "signal low" (EGARE).
- **Heading (optional):** `pos.coords.heading` (degrees 0–360). Used only for the "aligned" state when heading is stable.

---

## 2. Confidence gate (mandatory)

- **Rule:** If `accuracy_m` is **missing** or **> 50 m**, do **not** compute alignment. Show the same state as "no GPS": EGARE, alignmentIndex 0, holdProgress01 0 (instrument seeking axis / hold still).
- **Constants:** `MERIDIEN_ACCURACY_THRESHOLD_M = 50` in `src/utils/meridien-geo.ts`. Use `isAccuracySufficient(accuracy_m)` from that module.
- **Why:** Poor accuracy makes "near / on line / aligned" misleading. The instrument must not claim alignment when the reading is unreliable.

---

## 3. Smoothing (recommended)

- **Rule:** Feed **smoothed** lat/lng into alignment and nearest-threshold logic, not raw GPS. Use a simple EMA over the last N samples (e.g. `emaPoint(prev, next, 0.25)` from `meridien-geo.ts`).
- **Constants:** `MERIDIEN_EMA_ALPHA = 0.25` (tunable ~0.2–0.35).
- **Why:** Raw GPS jitters; smoothing keeps the needle and "Lire" threshold from flickering.

---

## 4. Heading only when stable (optional)

- **Rule:** Use heading to promote to "aligned" only when recent headings are stable (e.g. variance of last 5 readings ≤ 25°). Use `isHeadingStable(headings, MERIDIEN_HEADING_STABLE_MAX_VARIANCE_DEG)` and pass `useHeadingForAligned` into `getMeridienState`.
- **Why:** Unstable heading (e.g. indoors) would flip aligned/on_line; ignoring it keeps the state coherent.

---

## 5. No dead ends (mandatory)

- **Rule:** The Meridian state object passed to the instrument UI must **always** be a valid shape (state, alignmentIndex, holdProgress01, recognized, nearestPlaceId, micro). Never pass `undefined` or throw on missing GPS/heading.
- **Fallback:** When there is no position, or accuracy is insufficient, or coords are outside the Paris bbox, return the same fallback object: state EGARE, alignmentIndex 0, holdProgress01 0, recognized all NON_RECONNU, nearestPlaceId null.

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
| Gate on accuracy ≤ 50 m  | Yes        | `isAccuracySufficient(accuracy_m)` → else EGARE |
| Use smoothed lat/lng     | Recommended| `emaPoint(prev, next, MERIDIEN_EMA_ALPHA)` |
| Use heading only if stable | Optional | `isHeadingStable(headings, 25)` → `useHeadingForAligned` |
| Always valid state object| Yes        | Fallback = EGARE, 0, 0, … |
| Out-of-bbox → EGARE      | Optional   | `inParisBbox(lat, lng)` |
| No raw lat/lon storage   | Yes        | No new persistence |

All helpers and constants live in **`src/utils/meridien-geo.ts`**. The main screen that honors this contract is **`src/components/MeridiensLive.tsx`**.
