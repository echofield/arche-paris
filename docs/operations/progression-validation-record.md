# Progression Validation Record

Release reference: main@606b69492d2e7541b6b9c61a95a2a98f1ff7f6b9
Date: 2026-04-04
Environment: production
Release candidate commit: 606b69492d2e7541b6b9c61a95a2a98f1ff7f6b9

LOCAL_VALIDATION_STATUS: PASS
LIVE_VALIDATION_STATUS: PASS
VALIDATION_STATUS: PASS
HARDENING_CHECKS: PASS
HARDENING_CHECKS_EVIDENCE: npm run typecheck:critical PASS; npm run test:hardening PASS; migration supabase db push PASS on candidate SHA 606b69492d2e7541b6b9c61a95a2a98f1ff7f6b9.
SMOKE_SCRIPT: PASS
SMOKE_SCRIPT_EVIDENCE: production smoke run returned SMOKE_STEP baseline_get PASS, SMOKE_STEP cas_write PASS, SMOKE_STEP version_increment PASS, SMOKE_STEP stale_conflict PASS, SMOKE_RESULT status=PASS on candidate SHA 606b69492d2e7541b6b9c61a95a2a98f1ff7f6b9.
BOOTSTRAP_TEST: PASS
BOOTSTRAP_TEST_EVIDENCE: production URL https://www.xn--arch-paris-e7a.com/?card=PS-0001; /api/card-auth/check-card returned 200; /api/card-auth/login-card returned 200; diagnostics showed [ARCHE][CardScopedProgression] MIGRATION_STARTED then MIGRATION_SUCCEEDED; app rendered usable content with no crash.
CONFLICT_TEST: PASS
CONFLICT_TEST_EVIDENCE: two concurrent sessions on https://www.xn--arch-paris-e7a.com/?card=PS-0001#carnet; Session A saved conflict A; without reloading Session B, Session B saved conflict B; both entries were present afterward with conflict A preserved before conflict B; no destructive overwrite, no unrecoverable state.
FALLBACK_TEST: PASS
FALLBACK_TEST_EVIDENCE: production URL https://www.xn--arch-paris-e7a.com/?card=PS-0001; while already loaded online in Carnet, network was switched offline, unique entry test offline was created and remained visible; after reconnect, homepage return, hard refresh, and return to Carnet, test offline was still present; no crash during offline or recovery flow.

FAILED_STEP: NONE
FAILURE_SUMMARY: NONE
INCIDENT_REFERENCE: NONE

OPERATOR_SIGNOFF: APPROVED
OPERATOR_SIGNOFF_BY: echof (operator-guided live validation)
OPERATOR_SIGNOFF_AT_UTC: 2026-04-04T11:38:30.5846746Z

Notes:
- LOCAL_VALIDATION_STATUS means CI/local hardening checks only.
- LIVE_VALIDATION_STATUS means production protocol executed end-to-end.
- VALIDATION_STATUS can be PASS only when both local and live statuses are PASS.
- Every *_EVIDENCE field must point to concrete evidence (CI run URL, log path, artifact path, ticket URL, or screenshot path).
- If any validation step fails, set step status to FAIL, set VALIDATION_STATUS: FAIL, and fill FAILED_STEP, FAILURE_SUMMARY, INCIDENT_REFERENCE.
- Fill this record during the operator validation protocol.
- This file is a mandatory artifact when progression-critical surfaces change.
- Set all statuses to PASS only after completing the full production protocol.