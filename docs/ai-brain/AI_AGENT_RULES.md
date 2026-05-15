# AI AGENT RULES

## Mandatory Operating Mode
1. **DEEP SCAN LEVEL 3:** Never write code before doing a full search.
2. **Read-only First:** Create a plan and wait for user approval unless explicitly told otherwise.
3. **Financial Protection:** Any change to accounting, invoices, treasury, or inventory MUST use `runFinancialTx` or `runInventoryTx`.
4. **Tenant Protection:** `tenantId` must be explicitly provided in every Prisma operation.

## Forbidden Actions
- No `rm -rf`, `DROP DATABASE`, or `prisma db push --force-reset` without explicit permission.
- No modifying posted journals or ZATCA cleared invoices.
- No bypassing `tenantId`.

## Definition of Done
- TypeScript compiles cleanly.
- Transaction boundaries are intact.
- AI Project Memory is updated.
