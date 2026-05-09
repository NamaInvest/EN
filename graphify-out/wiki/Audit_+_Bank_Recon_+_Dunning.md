# Audit + Bank Recon + Dunning

> 28 nodes · cohesion 0.08

## Key Concepts

- **prisma.ts** (88 connections) — `prisma.ts`
- **getClient()** (5 connections) — `prisma.ts`
- **BankReconciliationEngine** (3 connections) — `bank-reconciliation.ts`
- **applySoftDeleteMiddleware()** (3 connections) — `prisma-soft-delete.ts`
- **RevenueRecognitionEngine** (3 connections) — `revenue-recognition.ts`
- **MoyasarEngine** (3 connections) — `payment-gateway/moyasar.ts`
- **prisma-soft-delete.ts** (3 connections) — `prisma-soft-delete.ts`
- **audit.ts** (2 connections) — `audit.ts`
- **bank-reconciliation.ts** (2 connections) — `bank-reconciliation.ts`
- **dunning-engine.ts** (2 connections) — `dunning-engine.ts`
- **DunningEngine** (2 connections) — `dunning-engine.ts`
- **PaymentTermsEngine** (2 connections) — `payment-terms.ts`
- **getDbUrl()** (2 connections) — `prisma.ts`
- **withRLS()** (2 connections) — `prisma.ts`
- **moyasar.ts** (2 connections) — `payment-gateway/moyasar.ts`
- **payment-terms.ts** (2 connections) — `payment-terms.ts`
- **revenue-recognition.ts** (2 connections) — `revenue-recognition.ts`
- **logAuditAction()** (1 connections) — `audit.ts`
- **.autoMatch()** (1 connections) — `bank-reconciliation.ts`
- **.importStatement()** (1 connections) — `bank-reconciliation.ts`
- **.executeDailyRun()** (1 connections) — `dunning-engine.ts`
- **.calculateDueSchedule()** (1 connections) — `payment-terms.ts`
- **getTenantFromNextContext()** (1 connections) — `prisma.ts`
- **hardDelete()** (1 connections) — `prisma-soft-delete.ts`
- **.generateSchedule()** (1 connections) — `revenue-recognition.ts`
- *... and 3 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- `audit.ts`
- `bank-reconciliation.ts`
- `dunning-engine.ts`
- `payment-gateway/moyasar.ts`
- `payment-terms.ts`
- `prisma-soft-delete.ts`
- `prisma.ts`
- `revenue-recognition.ts`

## Audit Trail

- EXTRACTED: 137 (99%)
- INFERRED: 2 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*