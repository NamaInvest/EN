# Saga / Distributed Transactions

> 12 nodes · cohesion 0.21

## Key Concepts

- **Saga** (6 connections) — `workflow/saga/coordinator.ts`
- **sagas.ts** (5 connections) — `workflow/saga/sagas.ts`
- **purchase-sagas.ts** (4 connections) — `workflow/saga/purchase-sagas.ts`
- **coordinator.ts** (3 connections) — `workflow/saga/coordinator.ts`
- **.execute()** (2 connections) — `workflow/saga/coordinator.ts`
- **.run()** (2 connections) — `workflow/saga/coordinator.ts`
- **.addStep()** (1 connections) — `workflow/saga/coordinator.ts`
- **buildGRNSaga()** (1 connections) — `workflow/saga/purchase-sagas.ts`
- **buildPurchaseOrderSaga()** (1 connections) — `workflow/saga/purchase-sagas.ts`
- **buildMonthCloseSaga()** (1 connections) — `workflow/saga/sagas.ts`
- **buildPayrollRunSaga()** (1 connections) — `workflow/saga/sagas.ts`
- **buildSalesInvoiceSaga()** (1 connections) — `workflow/saga/sagas.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `workflow/saga/coordinator.ts`
- `workflow/saga/purchase-sagas.ts`
- `workflow/saga/sagas.ts`

## Audit Trail

- EXTRACTED: 28 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*