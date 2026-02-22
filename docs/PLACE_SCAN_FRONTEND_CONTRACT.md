# Place Scan (Lecture du Lieu) — frontend designer contract

What the frontend needs to know to **honor** the Place Scan instrument: how to call it, what you get back, and how to display it without breaking the contract.

---

## 1. What Place Scan is

Place Scan returns **four factual cards** about the user’s current place in Paris: a landmark, a cultural line, a spatial identity, and a “now” (time-of-day) state. It does **not** track who is where, does **not** return counts or metrics, and does **not** store raw lat/lon. It is **read-only** for the client: you send position, you get a stable result.

---

## 2. How to call it

**API (from `src/lib/api.ts`):**

```ts
const result = await api.placeScan({ lat: number, lon: number, heading?: number });
// result: { data: PlaceScanResult | null, error: string | null }
```

- **Required:** `lat`, `lon` (WGS84, valid numbers).
- **Optional:** `heading` (degrees 0–360). Used only for server-side telemetry buckets; does **not** change the four cards the user sees.
- Use the same auth as the rest of the app (Supabase + optional card header). The edge function accepts card sessions.

**When to call:** When the user is on a screen that shows “Lecture du Lieu” / Place Scan and you have a valid position (e.g. from geolocation). You can throttle or debounce calls (e.g. after movement or every N seconds) to avoid hammering the backend.

---

## 3. What you get back (success)

On success, `result.data` is a **PlaceScanResult** and `result.error` is `null`.

**Guaranteed shape:**

| Field      | Type   | Meaning |
|-----------|--------|--------|
| `version` | `1`    | Schema version. Always `1`. If the backend ever returns a higher number, the response shape may have changed. |
| `zone_id` | string | Zone identifier (e.g. `PAR-01`, …, `PAR-20`, or `PARIS` when outside zone coverage). |
| `h3`      | string | H3 cell index at resolution 9 (~174 m). Coarse, privacy-safe. |
| `cards`   | tuple  | **Exactly 4 cards, in this order:** see below. |

**Card order (do not reorder):**

| Index | `type`     | Contents | Use in UI |
|-------|------------|----------|-----------|
| 0     | `landmark` | `label`, `direction`, `distance` | e.g. “Louvre courtyard — N — here” |
| 1     | `cultural` | `line` (one sentence) | One factual line about the place. |
| 2     | `spatial`  | `identity` (one word) | e.g. “Axis”, “Quarter”, “Threshold”. |
| 3     | `now`      | `state` (see below) | Time-of-day state only. |

**Allowed values (use these for copy and styles):**

- **Landmark**
  - `direction`: `'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'`
  - `distance`: `'here' | 'near' | 'a short walk' | 'a walk'`
- **Now**
  - `state`: **only** `'opening'` | `'active'` | `'transition'` | `'quiet'`
  - No other “now” values exist. Map to your copy (e.g. morning / day / evening / night).

**TypeScript (from `src/lib/api.ts`):**

```ts
interface PlaceScanResult {
  version: 1;
  zone_id: string;
  h3: string;
  cards: [
    { type: 'landmark'; label: string; direction: PlaceScanDirection; distance: PlaceScanDistance },
    { type: 'cultural'; line: string },
    { type: 'spatial'; identity: string },
    { type: 'now'; state: PlaceScanNowState },
  ];
}
```

---

## 4. Error handling

- **Network / invoke error:** `result.error` is set, `result.data` is `null`. Show a generic “unable to read place” (or retry) — do **not** show raw error strings from the backend.
- **400 (bad request):** Only when the body is invalid (e.g. invalid JSON) or **coordinates fail sanity checks** (missing, NaN, or outside a valid range). So: validate `lat`/`lon` on the client before calling (e.g. finite numbers in a Paris-ish range) to minimise 400s.
- **401 / 403:** Handle like the rest of the app (e.g. prompt sign-in or card).

After coordinates pass validation on the backend, the handler **always returns 200** (with a fallback “PARIS” result if no zone is found). So you will not get 400 for “slightly off” coordinates once the request is accepted.

---

## 5. What the frontend must do to honor the instrument

| Requirement | Why |
|-------------|-----|
| Send only **valid** `lat`, `lon` (and optional `heading`) | Avoids 400 and keeps the “always 200 after coords pass” contract. |
| Use **`result.data`** as the single source of truth for the four cards | No inventing or reordering cards. |
| Render cards in **order: landmark → cultural → spatial → now** | Matches backend contract and future-proofs if more cards are added later. |
| Use **only** the allowed `direction`, `distance`, and `now.state` values for copy/styles | Prevents invalid UI states; “now” has exactly four states. |
| Treat `version === 1` as the current schema | If you ever see `version > 1`, consider handling new fields or card order. |
| Do **not** display or store raw `lat`/`lon` from the response | The response does **not** echo coordinates; no need to show them. |
| Do **not** expect or show counts, metrics, or “who else is here” | Place Scan does not return them. |

---

## 6. What the frontend must NOT do

- **Do not** reorder the four cards (landmark, cultural, spatial, now).
- **Do not** invent or assume other `now.state` values (only `opening` | `active` | `transition` | `quiet`).
- **Do not** show backend error messages verbatim to the user.
- **Do not** treat a successful result as “tracking” or “presence” — it is a one-shot reading.
- **Do not** cache results in a way that reuses an old `PlaceScanResult` for a clearly different place without re-calling the API.

---

## 7. Summary checklist for the designer

- [ ] Call `api.placeScan({ lat, lon, heading? })` when the Place Scan screen is active and position is available.
- [ ] Validate coords (finite, sensible range) before calling to reduce 400s.
- [ ] On success, read `result.data` and render **four cards in order**: landmark → cultural → spatial → now.
- [ ] Use only the allowed enums for direction, distance, and `now.state`; map `now.state` to your copy (e.g. opening/active/transition/quiet).
- [ ] On error, show a generic message; do not expose raw backend errors.
- [ ] Do not display or store raw lat/lon from the response; do not expect counts or presence data.

**Types and API:** `src/lib/api.ts` — `PlaceScanResult`, `PlaceScanDirection`, `PlaceScanDistance`, `PlaceScanNowState`, `api.placeScan(...)`.
