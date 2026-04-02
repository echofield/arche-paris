# Progression Branch Protection (Main)

This document defines the mandatory GitHub branch protection settings for `main` when progression-critical changes are present.

## Required Status Checks

Enable **Require status checks to pass before merging** and require this exact check:
- `progression-hardening-gate`

This check is produced by:
- workflow file: `.github/workflows/hardening-critical.yml`
- workflow name: `Progression Hardening Gate`
- job/check name: `progression-hardening-gate`

## Required Pull Request Rules

Enable:
- Require a pull request before merging
- Require conversation resolution before merging
- Require branches to be up to date before merging
- Include administrators

Disable or restrict:
- Force pushes to `main`
- Direct pushes to `main` for non-admin operators

## Required Operator Review Behavior

Before approving merge on progression-critical PRs, reviewer must verify:
- `docs/operations/progression-validation-record.md` is updated and non-placeholder
- all required status and evidence fields are present
- smoke evidence is attached (`SMOKE_RESULT status=PASS`)
- manual bootstrap/conflict/fallback evidence references are attached
- release and rollback anchors are identified in release notes

## Release / Rollback Anchor Discipline

- Release anchor: merge commit that passed `progression-hardening-gate` with approved validation record.
- Rollback anchor: previous release anchor with known-good progression behavior.
- Operator release notes must include both commit SHAs.

## Verification Cadence

- verify branch protection settings at every progression release candidate
- re-verify after any repository settings change