# TESTING STRATEGY

## 1. Existing Test Architecture
The testing suite is segmented into distinct risk profiles:
- **Unit Tests** (`npm run test:unit`): Validates pure functions, utility calculations (e.g., rounding logic), and payload sanitizers.
- **Financial Tests** (`npm run test:financial`): Specialized integration tests that assert debits == credits, strict immutability of POSTED journals, and transactional rollback behaviors on failure.
- **Integration Tests** (`npm run test:integration`): Tests API endpoints using a test database, asserting correct HTTP status codes and database mutations.
- **E2E Tests** (`npm run test:e2e`): Cypress/Playwright tests validating critical UI paths (e.g., POS checkout, ZATCA QR display).

## 2. Testing Constraints (Golden Rules)
1. **Zero-Error TypeScript**: `npx tsc --noEmit` must pass without errors before ANY test is run or commit is made.
2. **Tenant Isolation Testing**: Tests must intentionally attempt to access `Tenant B` data while authenticated as `Tenant A` and verify that a 403 or empty array is returned.

## 3. Critical Missing Protections (Coverage Gaps)
- **Concurrency / Race Condition Tests**: Missing heavy load tests simulating two cashiers attempting to sell the exact same final inventory item simultaneously.
- **Outbox Relay Mocking**: Need reliable tests asserting that if Redis goes down, `OutboxEvent` generation still succeeds but remains `PENDING` until Redis recovers.
- **Idempotency Load Tests**: Verify that submitting the exact same payload twice within 10ms with the same `x-idempotency-key` returns the cached response rather than creating duplicate journals.

## 4. Stable Baselines (Do Not Re-test unless Regression)
The following areas are considered "Baseline Stable" and heavily audited:
- Treasury Phase A
- Sales/Purchase Returns Atomicity
- Payment Run GL/Treasury Binding
- FX Gain/Loss Calculation
- Purchase Partial Payment Atomicity
