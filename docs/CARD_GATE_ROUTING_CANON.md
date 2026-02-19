# Card Gate Routing Canon

## Canonical public path
- Frontend must call only: `/api/card-gate/*`
- Example protected flow:
  - `POST /api/card-gate/pair`
  - `GET /api/card-gate/zone-progress`
  - `GET /api/card-gate/world/snapshot`

## Why rewrite exists
- Runtime behavior in this project requires path mapping:
  - `/api/card-gate/:path* -> /api/card-gate?path=:path*`
- Without this mapping, some POST routes can resolve to proxy root instead of forwarded path.

## Non-regression smoke
- Run `tests/card-gate-proxy-smoke.ps1` against production.
- The test must prove:
  - POST body reaches card-gate (`card_id required` on empty payload)
  - Set-Cookie is forwarded and persisted in cookie jar
  - Protected route works after pairing (`zone-progress` not 401)
