# Lot / Batch Tracking

> 6 nodes · cohesion 0.33

## Key Concepts

- **LotEngine** (5 connections) — `lot-engine.ts`
- **lot-engine.ts** (2 connections) — `lot-engine.ts`
- **.getExpiringBatches()** (1 connections) — `lot-engine.ts`
- **.quarantineBatch()** (1 connections) — `lot-engine.ts`
- **.recallBatch()** (1 connections) — `lot-engine.ts`
- **.releaseFromQuarantine()** (1 connections) — `lot-engine.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `lot-engine.ts`

## Audit Trail

- EXTRACTED: 11 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*