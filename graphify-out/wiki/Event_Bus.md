# Event Bus

> 14 nodes · cohesion 0.20

## Key Concepts

- **EventBus** (7 connections) — `event-bus.ts`
- **.dispatch()** (4 connections) — `event-bus.ts`
- **index.ts** (4 connections) — `queue/index.ts`
- **WebhookManager** (4 connections) — `webhooks/manager.ts`
- **manager.ts** (3 connections) — `webhooks/manager.ts`
- **.enqueueDelivery()** (3 connections) — `webhooks/manager.ts`
- **.markFailed()** (2 connections) — `event-bus.ts`
- **.markProcessed()** (2 connections) — `event-bus.ts`
- **.publish()** (2 connections) — `event-bus.ts`
- **.replayPending()** (2 connections) — `event-bus.ts`
- **.dispatchEvent()** (2 connections) — `webhooks/manager.ts`
- **.sign()** (2 connections) — `webhooks/manager.ts`
- **.subscribe()** (1 connections) — `event-bus.ts`
- **startWorkers()** (1 connections) — `queue/index.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `event-bus.ts`
- `queue/index.ts`
- `webhooks/manager.ts`

## Audit Trail

- EXTRACTED: 39 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*