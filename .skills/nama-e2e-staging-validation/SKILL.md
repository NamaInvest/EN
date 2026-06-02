# 🧪 Skill — nama-e2e-staging-validation

## Purpose
تصميم وتشغيل E2E آمن على بيئات staging أو local production-like فقط.

## Allowed Actions
- Read Playwright configuration
- List E2E tests
- Run E2E only on safe local/staging URLs
- Generate E2E reports

## Forbidden Actions
- Production E2E
- Real payments
- Real ZATCA production onboarding
- Real financial posting on production environments
- Using live customer database

## Outputs
- `E2E_STAGING_VALIDATION_PLAN.md`
- `E2E_STAGING_VALIDATION_REPORT.md`
- `PLAYWRIGHT_E2E_RESULTS.md`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/03-quality-and-testing.md`

## Evidence Tags
- `VERIFIED_BY_TEST`

## Stop Conditions
- Staging / local environment URL must be explicitly verified before execution. Any production target stops execution.
