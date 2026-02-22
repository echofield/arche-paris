# Place Scan (Lecture du Lieu) — Backend Audit Summary

## A) Repo audit (done before implementation)

### Edge Functions and auth
- **card-gate** ([supabase/functions/card-gate/index.tsx](supabase/functions/card-gate/index.tsx)): Hono app, uses `requireOptionalJwt` / `requireJwt` and card session (Cookie + `X-ARCHE-CARD-CODE`).
- **zones-enter**, **zone-consciousness**, etc.: Use `requireUserId(req, { allowCardSession: true })` from [supabase/functions/_shared/auth.ts](supabase/functions/_shared/auth.ts). Card session is resolved via Cookie + header and validated against `cards` with `device_secret_hash`.
- **Shared validation**: [supabase/functions/_shared/validation.ts](supabase/functions/_shared/validation.ts) — `validateCoordsSanity(lat, lng)`, `loadZoneBbox(zone_id)`, `checkBboxContainment(lat, lng, bbox)`.

### Zones table
- **Defined in**: [supabase/migrations/20260217000001_tiny_seed_schema.sql](supabase/migrations/20260217000001_tiny_seed_schema.sql).
- **Columns**: `zone_id` (PK), `city_code`, `min_lat`, `min_lng`, `max_lat`, `max_lng`, `center_lat`, `center_lng`, `active`.
- **Seed**: [supabase/migrations/20260217000006_seed_paris_zones.sql](supabase/migrations/20260217000006_seed_paris_zones.sql) — PAR-01 … PAR-20 with real bboxes and centers.

### resolveZoneByH3
- **Location**: [supabase/functions/zone-consciousness/index.ts](supabase/functions/zone-consciousness/index.ts) (lines 72–109).
- **Behaviour**: Resolves zone from an **h3 string** (used as zone_id, e.g. PAR-01): first looks up `zones` by `zone_id = h3`, then falls back to `arche_events` payload. Not lat/lon → zone.
- **For place-scan**: Lat/lon → zone is done by bbox containment. New helper **resolveZoneByLatLon** added in [supabase/functions/_shared/territory.ts](supabase/functions/_shared/territory.ts).

### H3 utilities
- **Before**: No H3 (Uber) library in repo; “h3” in codebase is the zone identifier string (PAR-01, etc.), not a hexagonal index.
- **Added**: [supabase/functions/_shared/h3.ts](supabase/functions/_shared/h3.ts) — `safeLatLngToH3(lat, lng, res)` using `h3-js` (esm.sh), resolution 9; returns `null` on error so response can fallback to `zone_id`.

---

## B) New API

- **Endpoint**: `POST supabase/functions/place-scan` ([supabase/functions/place-scan/index.ts](supabase/functions/place-scan/index.ts)).
- **Request**: `{ lat: number, lon: number, heading?: number }`.
- **Response**: `PlaceScanResult` — `version` (1), `zone_id`, `h3`, and 4 cards in fixed order (landmark, cultural, spatial, now). No raw location stored; no “who is here”; distance is qualitative only. Adjustments: H3 fallback to zone_id; zone anchors (1 per arrondissement) then meridian fallback; Now states opening/active/transition/quiet; place_scan_events log (card_hash only) + 2s cooldown. After coords pass, always 200: if no zone, fallback zone_id "PARIS" with generic cards. Scan log: card_hash = HMAC-SHA256(card_id, secret); no plaintext card_id.

---

## C) Verification

### Local serve

From the repo root, with Supabase CLI and env (see below):

```bash
supabase functions serve place-scan
```

Or serve all functions:

```bash
supabase functions serve
```

Then POST to `http://localhost:54321/functions/v1/place-scan` (or your project’s functions URL).

### Required env (for local serve)

- `SUPABASE_URL` — project URL (e.g. `https://xxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` — used by the function for DB (zones, place_scan_events). Never expose to the client.
- `PLACE_SCAN_CARD_HASH_SECRET` — required for writing `place_scan_events.card_hash` (HMAC-SHA256(card_id)). If unset, the function skips the insert (response unchanged); no fallback to other secrets.

Set via `supabase/functions/.env` or `supabase functions serve --env-file .env.local`. If the service role key is missing, the function can still compute and return the 4-card result; only the scan log insert will fail (response unchanged).

### Sample request body

```json
{
  "lat": 48.8566,
  "lon": 2.3522,
  "heading": 90
}
```

Headers: `Content-Type: application/json`, and card session (Cookie `arche_refresh=...` and `X-ARCHE-CARD-CODE: <card_id>`) or Supabase Auth `Authorization: Bearer <access_token>`.

### Expected response shape (200)

Once `validateCoordsSanity` passes, the endpoint **always returns 200** (no dead ends). Example:

```json
{
  "version": 1,
  "zone_id": "PAR-04",
  "h3": "8a2a1072b59ffff",
  "cards": [
    { "type": "landmark", "label": "Hôtel de Ville", "direction": "N", "distance": "here" },
    { "type": "cultural", "line": "The Hôtel de Ville marks the civic heart of Paris." },
    { "type": "spatial", "identity": "Axis" },
    { "type": "now", "state": "active" }
  ]
}
```

- **API contract stability**: `version` is 1; card order is fixed (landmark, cultural, spatial, now). Any future schema or card-order change must bump `version`.
- `h3` is either a real H3 index string (resolution 9) or, if `safeLatLngToH3` fails (e.g. module not found at runtime), the same as `zone_id`. The response always includes `h3` and is valid either way.
- `cards[3].state` is one of: `opening` | `active` | `transition` | `quiet` (Europe/Paris: opening 6–10, active 10–18, transition 18–22, quiet 22–6).
- **Fallback when no zone**: If both containment and nearest-zone fail, response is `zone_id: "PARIS"`, `h3: "PARIS"` or real H3 if available, and generic cards: landmark "Paris", cultural "Edge of current map.", spatial "Threshold", now = current Paris state.

### H3 fallback behavior

- `safeLatLngToH3(lat, lng, 9)` returns `string | null`; on any error it returns `null`.
- place-scan uses `h3Index = safeLatLngToH3(lat, lon, 9) ?? zoneId` (or `"PARIS"` in fallback result), so the payload always has a string `h3`. No 500 or broken response if h3-js fails to load or throws.

### Scan log privacy (card_hash)

- `place_scan_events` stores `card_hash` only (migration `20260222000002_place_scan_events_card_hash.sql`). No plaintext `card_id`.
- `card_hash` = HMAC-SHA256(card_id, PLACE_SCAN_CARD_HASH_SECRET). No fallback; if secret missing, insert is skipped.
- Cooldown and future Echo logic query by `card_hash`; no lat/lon stored.

Client types live in [src/lib/api.ts](src/lib/api.ts) (PlaceScanResult).
