# Master Test Plan

## 1. Test Strategy (Pyramid)
- **Unit Tests (70%)**: Business logic, Prisma engines, utilities. (Jest)
- **Integration Tests (20%)**: API Routes, Database transactions. (Jest + Supertest)
- **E2E Tests (10%)**: Critical user flows, ZATCA submissions, Payroll. (Playwright)

## 2. Test Environments
- `DEV`: Local environment. Developers must run `npm test` before pushing.
- `STAGING`: Ephemeral DB with anonymized production data. Used for CI.
- `PROD-MIRROR`: Read-only clone for performance and load testing.

## 3. Test Data Management
- We use **Factories** (e.g., `customer.factory.ts`) instead of hardcoded data.
- E2E tests seed data via `prisma/seed-staging.ts` on initialization.
- **Never test with real PII data.**

## 4. Execution Schedule
- **On Commit**: Lint, Typecheck, Unit Tests (changed files only).
- **On PR**: Full Unit Suite, E2E Smoke Tests, Mutation Testing (Critical), Lighthouse CI.
- **Weekly**: Full Load Testing & Security Scanning.

## 5. Regression Suite
A subset of tests covering ZATCA, Journals, and Auth must always pass. Any failure blocks deployment.
