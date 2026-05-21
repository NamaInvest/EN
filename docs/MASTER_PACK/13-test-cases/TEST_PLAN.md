# Master Test Plan & QA Strategy

## 1. Test Strategy (The Testing Pyramid)
- **Unit Tests (60%)**: Validate pure logic engines (`auto-journal.ts`, `tax-calc.ts`). Fast, cheap, and isolated.
- **Integration Tests (30%)**: Validate APIs and DB transactions. Uses test DB and `PrismaClient` with rollback.
- **E2E Tests (10%)**: Validate critical business flows via Playwright (e.g. ZATCA submission, POS checkout).

## 2. Test Environments
1. **Dev (Local)**: SQLite or local Postgres for fast iteration.
2. **Staging (UAT)**: Replicates Production. Seeded with anonymized data.
3. **Production**: Read-only monitoring checks (Health checks, Smoke tests).

## 3. Test Data Management
- We use **Prisma Factories** (e.g., `customer.factory.ts`) instead of hardcoded data.
- **NEVER** use random data in tests without a fixed seed. Reproducibility is key.

## 4. Execution Schedule
- **On every commit**: Lint, TypeCheck, Unit Tests.
- **On every PR**: Integration Tests, Mutation Testing (on critical files), E2E Smoke Tests, Lighthouse budgets.
- **Nightly**: Full E2E suite, Load Tests (k6), Security Scans.

## 5. UAT & Release Signoff
Before tagging a release, a formal UAT must be executed.
See `UAT_SIGNOFF_TEMPLATE.md`.
