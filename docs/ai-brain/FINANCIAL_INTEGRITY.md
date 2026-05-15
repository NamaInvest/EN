# FINANCIAL INTEGRITY

## Atomicity Requirements
- All financial side-effects MUST be enclosed in `runFinancialTx(prisma, async (tx) => { ... })`.
- Prevents split-brain scenarios (e.g., stock reduced but invoice creation fails).

## Idempotency
- Use `x-idempotency-key` in headers for payment endpoints to prevent double-charging or double-posting.

## Golden Rules
- **DO NOT** delete posted journals.
- **DO NOT** bypass the Accounting Engine.
