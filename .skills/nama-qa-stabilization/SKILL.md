# Nama QA Stabilization Skill

## Purpose

Stabilize the testing and quality infrastructure for Nama Invest ERP.

This skill focuses on fixing and governing Jest, Vitest, TypeScript test configuration, ESLint test policy, safe coverage generation, and E2E safety boundaries.

## Current Known Baseline

- TypeScript: `PASS`
- ESLint: `FAIL`
- Jest: `FAIL`
- Vitest: `FAIL`
- Coverage: `COVERAGE_NOT_GENERATED`
- E2E: `NOT_RUN_REQUIRES_ENV_SAFETY_REVIEW`
- Production: `PRODUCTION_NOT_VERIFIED`

## Allowed Actions

- Read test reports.
- Read `package.json`.
- Read `jest.config.*`.
- Read `vitest.config.*`.
- Read `tsconfig*.json`.
- Read test files.
- Modify test configuration only after explicit approval.
- Modify test files only after explicit approval.
- Generate QA reports.
- Update `.ai-brain/03-quality-and-testing.md`.
- Update gap/risk/evidence/next-actions registers.

## Forbidden Actions

- Runtime code changes without explicit approval.
- Database writes.
- Production access.
- Running E2E against production.
- Running tests that perform live financial posting.
- Prisma migrations.
- Deploy.
- Git push.
- Reading secrets.

## Focus Areas

- `TS5011`
- `TS5107`
- `jest.fn` inside Vitest
- `Cannot find module './prisma-audit'`
- `expected 500 to be 201`
- `COVERAGE_NOT_GENERATED`
- ESLint test noise
- Safe unit/domain/integration/e2e separation

## Required Outputs

- `TEST_INFRA_STABILIZATION_REPORT.md`
- `TEST_RUNNER_MAP.md`
- `COVERAGE_BASELINE_REPORT.md`
- `COVERAGE_BY_MODULE.md`
- `.ai-brain/03-quality-and-testing.md`
- `.ai-brain/19-evidence-index.md`

## Evidence Tags

Use the standard Nama evidence tags only.

## Stop Conditions

Stop if the fix requires:

- Runtime financial logic changes.
- DB write.
- Schema migration.
- Production access.
- External services.
- Unsafe E2E.

## Approval Gates

- `GO_FOR_TEST_CONFIG_STABILIZATION_ONLY`
- `GO_FOR_RUNNER_SEPARATION_ONLY`
- `GO_FOR_MOCK_NORMALIZATION_ONLY`
- `GO_FOR_COVERAGE_BASELINE_AFTER_TEST_FIXES_ONLY`
- `GO_FOR_E2E_SAFETY_GATE_ONLY`
