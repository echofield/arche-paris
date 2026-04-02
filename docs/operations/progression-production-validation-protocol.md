# Progression Production Validation Protocol

This protocol is the operator runbook for card-scoped progression release validation.
It is mandatory when any progression-critical surface changes.

## Validation States

- `LOCAL_VALIDATION_STATUS`: hardening checks validated in CI/local only.
- `LIVE_VALIDATION_STATUS`: protocol steps executed against production with real card/session.
- `VALIDATION_STATUS`: `PASS` only when both local and live states are `PASS`.

## Environment Assumptions

Operator must have:
- Supabase CLI access to the production project.
- valid `service_role` configuration for function deploy/migration.
- one real paired production card and valid gate token.
- network path to `card-gate` function endpoint.

Required variables for smoke:
- `CARD_GATE_BASE_URL`
- `CARD_GATE_ACCESS_TOKEN`
- `ARCHE_CARD_ID`
- optional `PROGRESSION_SMOKE_OUTPUT` for JSON evidence artifact.

Required evidence artifacts:
- updated `docs/operations/progression-validation-record.md`
- smoke command output and/or `PROGRESSION_SMOKE_OUTPUT` JSON
- manual test evidence for bootstrap/conflict/fallback (logs, screenshots, run notes)

## Rollout Order (Strict)

1. DB migration
2. `card-gate` function deploy
3. automated smoke validation
4. manual bootstrap migration test
5. stale-client conflict test
6. fallback/local-mode test
7. validation record update + operator signoff

Do not reorder steps.

## Operator Checklist (Deterministic)

### Step 1: DB migration
Command:

```bash
supabase db push
```

Success output:
- migration command exits `0`
- `public.card_progression_snapshots` exists
- `version` and `client_updated_at` columns exist
- `version` default is set (`1`)

Failure output:
- `relation ... does not exist`
- `column ... does not exist`
- policy creation or permission failure during migration

Required evidence:
- CLI output showing applied migration and success exit
- schema verification output (table + required columns)

Rollback trigger:
- any migration error on production or schema verification mismatch after one retry.

### Step 2: `card-gate` function deploy
Command:

```bash
supabase functions deploy card-gate
```

Success output:
- deploy command exits `0`
- endpoint reachable after deploy

Failure output:
- build/deploy failure
- endpoint unavailable (`5xx`/timeout)

Required evidence:
- deploy output with revision reference
- reachability check output (`GET /progression/state` with valid token)

Rollback trigger:
- function deploy fails twice or endpoint remains unavailable after successful deploy output.

### Step 3: automated smoke validation
Command:

```bash
CARD_GATE_BASE_URL=... CARD_GATE_ACCESS_TOKEN=... ARCHE_CARD_ID=... npm run smoke:progression
```

Optional evidence artifact:

```bash
PROGRESSION_SMOKE_OUTPUT=artifacts/progression-smoke.json CARD_GATE_BASE_URL=... CARD_GATE_ACCESS_TOKEN=... ARCHE_CARD_ID=... npm run smoke:progression
```

Success output:
- `SMOKE_STEP step=baseline_get status=PASS`
- `SMOKE_STEP step=cas_write status=PASS`
- `SMOKE_STEP step=version_increment status=PASS`
- `SMOKE_STEP step=stale_conflict status=PASS`
- `SMOKE_RESULT status=PASS`

Failure output:
- `SMOKE_RESULT status=FAIL reason=missing_env`
- `SMOKE_RESULT status=FAIL reason=baseline_get_failed|cas_write_failed|version_not_incremented|stale_conflict_missing|...`

Required evidence:
- full smoke console output
- JSON artifact path if `PROGRESSION_SMOKE_OUTPUT` is used

Rollback trigger:
- smoke fails after one fix attempt and rerun.

### Step 4: manual bootstrap migration test
Procedure:
1. Prepare client with legacy local progression on valid production card.
2. Start app and authenticate card session.
3. Observe diagnostics and resulting progression state.

Success output:
- `MIGRATION_STARTED`
- `MIGRATION_SUCCEEDED` or `MIGRATION_SKIPPED`
- if server newer, explicit conflict diagnostics and safe server apply

Failure output:
- `BOOTSTRAP_FAILED`
- progression missing after bootstrap
- render regression/crash in progression surfaces

Required evidence:
- diagnostic log excerpt for bootstrap path
- before/after progression state notes (what was local, what persisted)

Rollback trigger:
- any reproducible data loss or crash during bootstrap flow.

### Step 5: stale-client conflict test
Procedure:
1. Device A writes progression (newer server version).
2. Device B (stale base version) attempts write.
3. Use in-app recovery path.

Success output:
- stale write rejected (no overwrite)
- structured diagnostics (`CONFLICT_DETECTED`, `RECONCILE_REQUIRED`)
- status banner shown with explicit resync action
- recoverable path completes after reconcile/retry

Failure output:
- stale client overwrites newer server data
- user remains blocked with no visible recovery state

Required evidence:
- stale write attempt log with conflict result
- screenshot/log of banner and recovery action
- post-reconcile note confirming recovery

Rollback trigger:
- any confirmed lost-update overwrite or unrecoverable user blockage.

### Step 6: fallback/local-mode test
Procedure:
1. Simulate server outage/offline.
2. Perform progression writes locally.
3. Restore connectivity and observe reconcile.

Success output:
- `LOCAL_FALLBACK_MODE` diagnostic emitted
- user sees recovery banner
- local progression remains intact
- reconcile clears degraded state after service recovery

Failure output:
- silent fallback with no diagnostic
- local progression loss
- no reconcile recovery after connectivity returns

Required evidence:
- offline diagnostic log excerpt
- local write confirmation while offline
- reconnect log showing reconcile completion and issue clear

Rollback trigger:
- offline write loss or inability to recover from fallback mode.

### Step 7: validation record and signoff
Update:
- `docs/operations/progression-validation-record.md`

Success output:
- all required markers set
- all required `*_EVIDENCE` fields reference concrete evidence
- `LOCAL_VALIDATION_STATUS: PASS`
- `LIVE_VALIDATION_STATUS: PASS`
- `VALIDATION_STATUS: PASS`
- `OPERATOR_SIGNOFF: APPROVED`
- `OPERATOR_SIGNOFF_BY` and `OPERATOR_SIGNOFF_AT_UTC` set

Failure output:
- missing markers
- any status left `PENDING` or non-`PASS`
- missing/placeholder evidence references
- placeholder signoff metadata

Rollback trigger:
- release is held; do not ship until record is complete and strict guard passes.

## Failure Triage

### A) `TABLE_NOT_FOUND` / `PROGRESSION_TABLE_MISSING`
- Cause: base migration missing
- Action: apply snapshot table migration, redeploy function, rerun smoke

### B) `MIGRATION_MISSING` / `PROGRESSION_SCHEMA_MISSING`
- Cause: versioning migration not applied
- Action: apply versioning migration, verify `version` + `client_updated_at`, rerun smoke

### C) `RLS_POLICY_DENIED` / `PROGRESSION_POLICY_DENIED`
- Cause: service-role policy or env misconfiguration
- Action: verify key/policy/env, redeploy, rerun smoke

### D) `MALFORMED_SERVER_RESPONSE`
- Cause: proxy/function contract drift
- Action: inspect payload shape at function boundary, rollback function if needed

### E) Persistent `RECONCILE_REQUIRED`
- Cause: stale client not converging or repeated concurrent writes
- Action: run manual reconcile path, verify version increments, inspect diagnostics per artifact

### F) Persistent `LOCAL_FALLBACK_MODE`
- Cause: endpoint/network incident
- Action: treat as incident, preserve local mode, restore service, verify recovery

## Rollback

Trigger immediate rollback if any holds:
- stale write overwrites newer server progression
- smoke keeps failing after one remediation cycle
- bootstrap causes crash or progression loss
- fallback mode loses progression or cannot recover

Rollback sequence:
1. Freeze rollout and declare release hold.
2. Re-deploy previous known-good `card-gate` revision.
3. Keep DB schema forward-compatible; do not destructive-downgrade table data.
4. Keep client in local-fallback behavior until server path is fixed.
5. Re-run full protocol from Step 1 after patch.

## Production Validity Definition

Progression is **production valid** only when all are true:
- `npm run typecheck:critical` passes.
- `npm run test:hardening` passes.
- smoke script passes on production target card (`SMOKE_RESULT status=PASS`).
- manual bootstrap/conflict/fallback steps pass.
- validation record is updated with:
  - `LOCAL_VALIDATION_STATUS: PASS`
  - `LIVE_VALIDATION_STATUS: PASS`
  - `VALIDATION_STATUS: PASS`
  - non-placeholder evidence references for all required fields
  - `OPERATOR_SIGNOFF: APPROVED`
  - explicit operator identity + timestamp

Until live steps pass, status is **locally validated only**.