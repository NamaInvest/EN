# Document Expiry Alerts

> 11 nodes · cohesion 0.24

## Key Concepts

- **DocumentExpiryEngine** (10 connections) — `document-expiry.ts`
- **.scanAndAlert()** (3 connections) — `document-expiry.ts`
- **document-expiry.ts** (2 connections) — `document-expiry.ts`
- **.calculateDaysRemaining()** (2 connections) — `document-expiry.ts`
- **.getRenewalCostEstimate()** (2 connections) — `document-expiry.ts`
- **.getSeverity()** (2 connections) — `document-expiry.ts`
- **.getWidgetData()** (2 connections) — `document-expiry.ts`
- **.dismissAlert()** (1 connections) — `document-expiry.ts`
- **.getDashboard()** (1 connections) — `document-expiry.ts`
- **.getEmployeeAlerts()** (1 connections) — `document-expiry.ts`
- **.markRenewed()** (1 connections) — `document-expiry.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `document-expiry.ts`

## Audit Trail

- EXTRACTED: 27 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*