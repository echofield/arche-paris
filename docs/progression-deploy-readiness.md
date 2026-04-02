# Progression Deploy Readiness Checklist

This checklist validates production readiness for card-scoped progression (`collection`, `traces`, `walks`, `quest_runs`) with server-authoritative versioning.

Operator protocol (strict rollout + triage + rollback): `docs/operations/progression-production-validation-protocol.md`.

## 1) Required Environment

Edge Function (`supabase/functions/card-gate`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CARD_GATE_JWT_SECRET`

Client build/runtime:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_ANON_KEY`

## 2) Required Schema and Policy Assumptions

Migrations must be applied in order:
1. `supabase/migrations/20260402000001_card_progression_snapshots.sql`
2. `supabase/migrations/20260402000002_card_progression_versioning.sql`

`public.card_progression_snapshots` must have:
- primary key `(card_id, artifact)`
- `payload jsonb`
- `updated_at timestamptz` (server timestamp)
- `version bigint not null` (monotonic, server-authoritative)
- `client_updated_at timestamptz null` (diagnostic only)

Required policy:
- `service_role_all_card_progression_snapshots` for `service_role`

## 3) Deploy Smoke Script (Real Card Session)

Run with a valid card JWT and card id:

```bash
CARD_GATE_BASE_URL=https://<project>.supabase.co/functions/v1/card-gate \
CARD_GATE_ACCESS_TOKEN=<access_jwt> \
ARCHE_CARD_ID=<card_id> \
node scripts/progression-smoke.mjs
```

Equivalent npm command:

```bash
CARD_GATE_BASE_URL=... CARD_GATE_ACCESS_TOKEN=... ARCHE_CARD_ID=... npm run smoke:progression
```

What this script validates:
- `GET /progression/state` baseline read
- `POST /progression/state` compare-and-set write using `base_version`
- version increment after write
- stale `base_version` returns explicit conflict payload

## 4) Manual Bootstrap Migration Check (First Valid Session)

1. Prepare a card with legacy local progression (collection/traces/walks/quest runs) on device.
2. Ensure card session is valid.
3. Load app and watch diagnostics:
   - `MIGRATION_STARTED`
   - `MIGRATION_SUCCEEDED` or `MIGRATION_SKIPPED`
   - optional `CONFLICT_DETECTED` if server is newer
4. Verify server rows exist for touched artifacts with `version >= 1`.

## 5) Manual Fallback-to-Local Check (Server Unavailable)

1. Open app with valid card session.
2. Simulate server outage (offline browser mode or block `/api/card-gate` / edge host).
3. Perform progression write (collect symbol, add walk entry, etc.).
4. Confirm diagnostics include `FALLBACK_LOCAL_MODE` and UX does not crash.
5. Restore network; confirm pending sync eventually succeeds and dirty markers clear.

## 6) Expected Deploy-Time Diagnostic Codes

Client/runtime diagnostics now emit explicit failure reasons:
- `TABLE_NOT_FOUND`: progression table missing (`42P01`)
- `MIGRATION_MISSING`: required progression schema columns missing (`42703`/schema drift)
- `RLS_POLICY_DENIED`: policy/permission failure (`42501`)
- `MALFORMED_SERVER_RESPONSE`: HTTP 200 but payload contract drift
- `CARD_SESSION_INVALID`: missing/invalid card session
- `FALLBACK_LOCAL_MODE`: server unreachable or request failure; local mode engaged

## 7) Explicitly Not Validated by Script

`scripts/progression-smoke.mjs` does not validate browser-only behavior:
- bootstrap migration trigger timing in React app lifecycle
- local fallback UX rendering while offline
- reconcile loop scheduling under visibility/online gates

Use sections 4 and 5 for these checks before broad rollout.

## 8) Validation Status Semantics

- Locally validated: `npm run typecheck:critical` and `npm run test:hardening` pass.
- Live validated: production smoke + manual bootstrap/conflict/fallback protocol completed with evidence.
- Production valid: both states pass and validation record is signed off.

## 9) Operator Evidence Discipline

- Do not set any validation status to `PASS` without evidence references in `docs/operations/progression-validation-record.md`.
- Keep smoke output logs and manual bootstrap/conflict/fallback evidence attached to the release record.
- Main-branch protection requirements are defined in `docs/operations/progression-branch-protection.md`.