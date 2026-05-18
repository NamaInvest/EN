# KNOWN RISKS AND TECH DEBT

## 1. Stable vs Unstable Areas
### Stable Baselines (Hardened)
- Treasury payment applications (Atomicity enforced).
- FX Gain/Loss (Symmetric matrix enforced).
- ZATCA Phase 1 & 2 integration (Via Outbox).
- Pharmacy Dispensing (PII protection via `PharmacyPayloadSanitizer`).

### Unstable / High Risk (Tech Debt Frontier)
- **Concurrent Manufacturing Backflushing**: Needs robust idempotency to prevent double-deducting raw materials on network retry.
- **Period Locks**: If a financial controller closes December, there needs to be a hard, system-wide check preventing any new `JournalEntry` with `date <= Dec 31`. Currently, this might rely on soft application logic rather than rigid middleware.
- **Global Inventory Reservations**: Soft-allocation of stock (e.g., placing an item in a cart but not yet paying) vs hard deduction. Needs a unified state machine.

## 2. Dangerous Patterns Discovered
- **Implicit Default Tenants**: Any legacy code checking `tenantId || 'default'` is a severe security vulnerability. All tenant IDs must be explicit.
- **Direct Database Updates on POSTED Journals**: Any raw `$queryRaw` bypassing the `immutable_posted_journal_entries` trigger.
- **Unbounded Queries**: `prisma.log.findMany()` without pagination/limits can cause OOM crashes in Next.js.

## 3. Migration Risks
- Modifying `JournalEntry` or `AccountMapping` schemas requires extreme care, as historical reports rely on exact data shapes. Use non-destructive additions only.
