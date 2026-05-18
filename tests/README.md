# Integration Test Harness

This directory contains automated integration tests covering the top 30 enterprise risks identified in Phase 2.

## Coverage
- **Accounting**: 8 critical tests (Period Locks, Year-End, Reversals).
- **Treasury**: 7 critical tests (Atomicity, FX Gains, Reconciliations).
- **Sales**: 7 critical tests (ZATCA, Returns Rollbacks, Credit Limits).
- **Procurement**: 5 critical tests (3-way match, GRIR rollbacks).
- **Security**: 3 critical tests (Strict Tenant Isolation).

## Test Harness
We utilize a virtual test harness (`tests/helpers/test-harness.ts`) with Vitest to guarantee zero-risk execution. Production databases are NEVER touched. 

Run tests via:
```bash
npm run test:integration
```
