# Progression Release Law

This law applies when any progression-critical surface changes.

## Progression-Critical Surfaces

- `src/utils/progression-sync.ts`
- `src/utils/progression-bootstrap.ts`
- `src/utils/progression-reconcile.ts`
- `src/utils/progression-ux-state.ts`
- `src/components/ProgressionStatusBanner.tsx`
- `src/utils/collection-service.ts`
- `src/utils/trace-service.ts`
- `src/utils/walk-service.ts`
- `src/utils/quest-run-service.ts`
- `supabase/functions/card-gate/**`
- `supabase/migrations/20260402000001_card_progression_snapshots.sql`
- `supabase/migrations/20260402000002_card_progression_versioning.sql`
- progression contract/reconcile/UX tests

## Mandatory Release Gates

A progression-critical change is release-eligible only if all gates pass:

1. `npm run typecheck:critical`
2. `npm run test:hardening`
3. `PROGRESSION_RELEASE_STRICT=1 npm run check:progression:release-law`
4. operator protocol executed: `docs/operations/progression-production-validation-protocol.md`
5. branch protection settings applied: `docs/operations/progression-branch-protection.md`

## Blocking Conditions

Release is blocked if any of the following is true:

- critical typecheck fails
- hardening suite fails
- progression release-law guard fails
- `docs/operations/progression-validation-record.md` is missing or not updated
- any required status is not `PASS`:
  - `LOCAL_VALIDATION_STATUS`
  - `LIVE_VALIDATION_STATUS`
  - `VALIDATION_STATUS`
  - `HARDENING_CHECKS`
  - `SMOKE_SCRIPT`
  - `BOOTSTRAP_TEST`
  - `CONFLICT_TEST`
  - `FALLBACK_TEST`
- any required evidence field is missing/placeholder:
  - `HARDENING_CHECKS_EVIDENCE`
  - `SMOKE_SCRIPT_EVIDENCE`
  - `BOOTSTRAP_TEST_EVIDENCE`
  - `CONFLICT_TEST_EVIDENCE`
  - `FALLBACK_TEST_EVIDENCE`
- signoff is incomplete or placeholder:
  - `OPERATOR_SIGNOFF != APPROVED`
  - missing `OPERATOR_SIGNOFF_BY`
  - missing/invalid `OPERATOR_SIGNOFF_AT_UTC`

## Operator Review Artifacts (Required)

- `docs/operations/progression-production-validation-protocol.md`
- `docs/operations/progression-validation-record.md`
- smoke output evidence (console output and/or `PROGRESSION_SMOKE_OUTPUT` JSON artifact)
- manual bootstrap/conflict/fallback evidence references

## Release / Rollback Anchor Rule

- Release anchor commit: merge commit on `main` where `progression-hardening-gate` passed and validation record is fully approved.
- Rollback anchor commit: previous release anchor commit with last known-good progression behavior.
- Progression release must not proceed without both anchors being identified in operator release notes.

## Enforcement

Automated enforcement:
- workflow: `.github/workflows/hardening-critical.yml` (job/check name: `progression-hardening-gate`)
- script: `scripts/check-progression-release-law.mjs`
- config: `.hardening/progression-release-law.json`

Manual enforcement:
- operator signoff on validation record
- reviewer verifies smoke evidence and manual bootstrap/conflict/fallback results before merge
- reviewer verifies branch protection settings are active per `docs/operations/progression-branch-protection.md`