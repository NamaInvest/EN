# Period Locking & Override Policy

## Core Principle
Financial records cannot be backdated or modified after periodic review. Nama Invest enforces a strict state machine on all financial periods to ensure tax compliance and ledger integrity.

## Period States
1. **OPEN:** The period is currently active. All users with standard permissions can post, modify, or delete unposted transactions.
2. **SOFT_LOCKED:** The period has undergone preliminary review (e.g., month-end reconciliation). Standard operations are blocked. Only authorized personnel can post adjusting entries.
3. **HARD_LOCKED:** The period has been officially closed, audited, and submitted to regulatory bodies (e.g., ZATCA, ZAKA). **No system user, including `MASTER_ADMIN`, can mutate records in this state.**

## Governance Engine (`assertPeriodWritable`)
The core enforcement logic lives within `src/lib/governance/period-lock.ts`. Every financial mutation routes through `assertPeriodWritable()`, which checks the target posting date against the `FinancialPeriod` records.

### Rejection Triggers
- Attempting to post to a `HARD_LOCKED` period throws an uncatchable `PeriodLockViolation`.
- Attempting to post to a `SOFT_LOCKED` period throws `PeriodLockViolation` unless a valid `OverrideContext` is supplied.

## The Override Policy

### 1. When is an override permitted?
Overrides are **only** permitted during the `SOFT_LOCKED` state to allow for necessary month-end or year-end adjustments (e.g., accruals, depreciation, FX adjustments) before final closure.

### 2. Who can override?
Only identities possessing the `MASTER_ADMIN` role (or explicitly whitelisted financial controller roles) can invoke an override. The identity is strictly verified via JWT/Session, never from user input.

### 3. How are overrides audited?
Every successful bypass of a `SOFT_LOCK` requires a `reason` and a `confirmationCode`. This information, alongside the `actorId` and timestamp, is permanently written to the database (`AuditLog`). This ensures full traceability for external auditors.

### 4. Cross-Tenant Protection
An override requested by an admin in `Tenant A` cannot bypass locks in `Tenant B`. The `tenantId` is strictly bound to the `OverrideContext` during its extraction phase.
