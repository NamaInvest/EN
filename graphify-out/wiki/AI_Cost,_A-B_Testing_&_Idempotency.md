# AI Cost, A/B Testing & Idempotency

> 19 nodes · cohesion 0.11

## Key Concepts

- **logger.ts** (25 connections) — `logger.ts`
- **notifications.ts** (3 connections) — `notifications.ts`
- **webhooks.ts** (3 connections) — `webhooks.ts`
- **ai-cost.ts** (2 connections) — `ai-cost.ts`
- **api-keys.ts** (2 connections) — `api-keys.ts`
- **idempotency.ts** (2 connections) — `idempotency.ts`
- **telemetry.ts** (2 connections) — `telemetry.ts`
- **ab-testing.ts** (1 connections) — `ab-testing.ts`
- **calculateCost()** (1 connections) — `ai-cost.ts`
- **hashKey()** (1 connections) — `api-keys.ts`
- **extractKey()** (1 connections) — `idempotency.ts`
- **formatLog()** (1 connections) — `logger.ts`
- **shouldLog()** (1 connections) — `logger.ts`
- **nextId()** (1 connections) — `notifications.ts`
- **renderTemplate()** (1 connections) — `notifications.ts`
- **generateId()** (1 connections) — `telemetry.ts`
- **generateId()** (1 connections) — `webhooks.ts`
- **signPayload()** (1 connections) — `webhooks.ts`
- **prompt-registry.ts** (1 connections) — `prompt-registry.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `ab-testing.ts`
- `ai-cost.ts`
- `api-keys.ts`
- `idempotency.ts`
- `logger.ts`
- `notifications.ts`
- `prompt-registry.ts`
- `telemetry.ts`
- `webhooks.ts`

## Audit Trail

- EXTRACTED: 51 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*