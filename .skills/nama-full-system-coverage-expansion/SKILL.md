# 📊 Skill — nama-full-system-coverage-expansion

## Purpose
توسيع التغطية من نطاق محدود إلى نطاق كامل للنظام، مع فصل التغطية حسب المجال (Unit, Integration, Critical Engines).

## Focus Areas
- Unit coverage
- Integration coverage
- Financial engines
- Security routes
- API routes
- Frontend critical flows
- Services
- Lib
- POS
- Sales
- Purchases
- Treasury
- Payroll
- ZATCA
- Tenant isolation

## Allowed Actions
- Read coverage reports
- Exclude non-tested directories in coverage
- Restructure vitest/jest configs for coverage precision
- Generate module coverage map

## Forbidden Actions
- Production changes
- DB writes
- Runtime financial logic changes
- Package install without approval

## Inputs
- `vitest.config.ts`
- `jest.config.ts`
- Source files

## Outputs
- `FULL_SYSTEM_COVERAGE_EXPANSION_REPORT.md`
- `COVERAGE_BY_MODULE.md`
- `COVERAGE_GAP_REGISTER.md`
- `coverage/coverage-summary.json`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/03-quality-and-testing.md`

## Evidence Tags
- `VERIFIED_BY_TEST`

## Stop Conditions
- DB write
- Production changes
- Runtime financial logic mutations

## Approval Gates
- Exclusions and thresholds must be approved in PR.
