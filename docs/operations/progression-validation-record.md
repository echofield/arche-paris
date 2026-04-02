# Progression Validation Record

Release reference: `TBD`
Date: `TBD`
Environment: `production`
Release candidate commit: `TBD`

LOCAL_VALIDATION_STATUS: PENDING
LIVE_VALIDATION_STATUS: PENDING
VALIDATION_STATUS: PENDING
HARDENING_CHECKS: PENDING
HARDENING_CHECKS_EVIDENCE: TBD
SMOKE_SCRIPT: PENDING
SMOKE_SCRIPT_EVIDENCE: TBD
BOOTSTRAP_TEST: PENDING
BOOTSTRAP_TEST_EVIDENCE: TBD
CONFLICT_TEST: PENDING
CONFLICT_TEST_EVIDENCE: TBD
FALLBACK_TEST: PENDING
FALLBACK_TEST_EVIDENCE: TBD

FAILED_STEP: NONE
FAILURE_SUMMARY: NONE
INCIDENT_REFERENCE: NONE

OPERATOR_SIGNOFF: PENDING
OPERATOR_SIGNOFF_BY: TBD
OPERATOR_SIGNOFF_AT_UTC: TBD

Notes:
- `LOCAL_VALIDATION_STATUS` means CI/local hardening checks only.
- `LIVE_VALIDATION_STATUS` means production protocol executed end-to-end.
- `VALIDATION_STATUS` can be `PASS` only when both local and live statuses are `PASS`.
- Every `*_EVIDENCE` field must point to concrete evidence (CI run URL, log path, artifact path, ticket URL, or screenshot path).
- If any validation step fails, set step status to `FAIL`, set `VALIDATION_STATUS: FAIL`, and fill `FAILED_STEP`, `FAILURE_SUMMARY`, `INCIDENT_REFERENCE`.
- Fill this record during the operator validation protocol.
- This file is a mandatory artifact when progression-critical surfaces change.
- Set all statuses to `PASS` only after completing the full production protocol.