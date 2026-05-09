# API Handler & Cache Middleware

> 20 nodes · cohesion 0.14

## Key Concepts

- **api-handler.ts** (10 connections) — `api-handler.ts`
- **accounting.service.ts** (9 connections) — `services/accounting.service.ts`
- **hr.service.ts** (9 connections) — `services/hr.service.ts`
- **sales.service.ts** (9 connections) — `services/sales.service.ts`
- **AccountingService** (8 connections) — `services/accounting.service.ts`
- **AppError** (6 connections) — `api-handler.ts`
- **cache.ts** (5 connections) — `cache.ts`
- **rateLimit()** (3 connections) — `rate-limit.ts`
- **rate-limit.ts** (3 connections) — `rate-limit.ts`
- **rateLimitOrReject()** (2 connections) — `rate-limit.ts`
- **.constructor()** (2 connections) — `services/accounting.service.ts`
- **.constructor()** (1 connections) — `api-handler.ts`
- **handleApiError()** (1 connections) — `api-handler.ts`
- **withApiHandler()** (1 connections) — `api-handler.ts`
- **.createManualJournal()** (1 connections) — `services/accounting.service.ts`
- **.getAccountBalance()** (1 connections) — `services/accounting.service.ts`
- **.getChartOfAccounts()** (1 connections) — `services/accounting.service.ts`
- **.getTrialBalance()** (1 connections) — `services/accounting.service.ts`
- **.listJournals()** (1 connections) — `services/accounting.service.ts`
- **.reverseJournal()** (1 connections) — `services/accounting.service.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `api-handler.ts`
- `cache.ts`
- `rate-limit.ts`
- `services/accounting.service.ts`
- `services/hr.service.ts`
- `services/sales.service.ts`

## Audit Trail

- EXTRACTED: 74 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*