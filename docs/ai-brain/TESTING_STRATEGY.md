
# Testing Strategy
**Generated At:** 2026-05-14T08:21:09.109Z

## Current Status
- Unit tests run via Jest + ts-jest.
- E2E via Playwright.

## Financial Integrity Tests
- Must assert that failing inventory rolls back the invoice.
- Idempotency tests must assert 409 Conflict on parallel requests.

## How to run
- `npm run test:unit`
- `npx tsc --noEmit` (Critical gatekeeper for CI builds)
