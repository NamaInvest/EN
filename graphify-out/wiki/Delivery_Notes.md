# Delivery Notes

> 7 nodes · cohesion 0.48

## Key Concepts

- **db()** (5 connections) — `delivery-note-engine.ts`
- **DeliveryNoteEngine** (5 connections) — `delivery-note-engine.ts`
- **delivery-note-engine.ts** (2 connections) — `delivery-note-engine.ts`
- **.confirmDelivery()** (2 connections) — `delivery-note-engine.ts`
- **.createFromSalesOrder()** (2 connections) — `delivery-note-engine.ts`
- **.createInvoiceFromDN()** (2 connections) — `delivery-note-engine.ts`
- **.list()** (2 connections) — `delivery-note-engine.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `delivery-note-engine.ts`

## Audit Trail

- EXTRACTED: 20 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*