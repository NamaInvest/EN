# Testing Governance

## Testing Philosophy
Due to the financial and multi-tenant nature of Nama Invest ERP, tests are not just for code correctness; they are a critical governance mechanism. Testing is divided structurally to validate isolation, atomicity, and financial integrity.

## Integration Testing Strategy
We prioritize **Integration Tests** over shallow unit tests for all critical pathways.
- **Coverage Domains:** Treasury, Sales, Purchases, Manufacturing, and Core Journal Engine.
- **Database Interaction:** Integration tests execute against real or fully-mocked Prisma schemas to validate the structural integrity of complex SQL joins, constraints, and cascading updates.

## Mocking Strategy for Financial Integrity
- **Transactional Mocking:** We utilize the `vi.mock('@/lib/db/transaction')` pattern to aggressively intercept `runFinancialTx` and `withTransaction`.
- **Prisma Context Proxy:** Mocked Prisma instances are directly fed into the transaction callbacks. This ensures that any `tx.entity.create` call accurately hits our mocked resolvers, allowing us to simulate race conditions and database constraint violations.
- **Dynamic Imports Protection:** Complex services (e.g., `TreasuryPostingService`, `ZatcaService`) are either dynamically mocked or their dependent Prisma calls are fully supported within the mock context to prevent `Undefined TypeErrors` during test execution.

## Tenant Isolation & Security Testing
Every API route test suite must include scenarios verifying:
1. **Header Ignorance:** Validating that injecting `tenantId` or `role` into the JSON body is successfully ignored by the controller.
2. **Context Bleed:** Validating that an authorized request for Tenant A cannot mutate or query records for Tenant B.
3. **Override Rejection:** Validating that requests attempting to bypass `SOFT_LOCK` without the proper HTTP headers (`X-Soft-Lock-Override-Reason`) or valid permissions are hard-rejected (HTTP 401/403/500).

## Rollback & Atomicity Testing
Tests explicitly validate the "Fail-Fast" nature of the application. If Step 3 of a 5-step financial transaction fails (e.g., Inventory limits exceeded), the test asserts that Steps 1 and 2 (e.g., Payment deductions) are completely rolled back and no partial state is left in the database.
