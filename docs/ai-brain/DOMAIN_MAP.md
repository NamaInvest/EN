
# Domain Map
**Generated At:** 2026-05-14T11:46:55.234Z

## 1. Accounting Domain
- **Purpose:** Double-entry journal system.
- **Dependencies:** Sales, Purchases, Treasury.
- **Rules:** Must balance. Auto-journals generated synchronously inside transaction.

## 2. Sales & POS Domain
- **Purpose:** B2B/B2C invoicing and retail.
- **Rules:** Must deduct inventory and create journal. Idempotency enforced.

## 3. Purchases Domain
- **Purpose:** Procurement lifecycle (PR -> PO -> GRN -> Bill).
- **Rules:** 3-way matching. Strict transaction atomicity required.

## 4. ZATCA Domain
- **Purpose:** KSA Tax Authority E-Invoicing.
- **Rules:** Asynchronous XML generation. Never block the main API thread.

## 5. Tenant Management (ICE)
- **Purpose:** SaaS lifecycle, trials, onboarding.
- **Rules:** Master DB context separated from Tenant context.
