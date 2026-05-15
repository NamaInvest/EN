# INTEGRATIONS

## 1. ZATCA
- KSA E-Invoicing. Phase 2 (Clearance & Reporting).
- Extreme caution: Cryptographic signatures require strict order.

## 2. Payment Gateways
- Mada / Local Gateways for POS.
- Webhooks must be wrapped in Idempotency & `runFinancialTx`.

## 3. E-commerce Sync (Salla, etc.)
- Webhooks incoming must deduct stock and update treasury atomically.
