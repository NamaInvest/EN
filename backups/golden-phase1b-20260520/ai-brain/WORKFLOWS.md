# Workflows

# Project Brain

Generated: 2026-05-18 02:34:44 +03:00

Scan facts:
- API routes: 850
- Prisma models: 609
- Prisma enums: 2
- Pages: 492
- Tests: 83
- Graphify files: 4576
- Graphify words: 6562824
- Sensitive skipped by graphify: 14
- graph.html: 27.75 MB, updated 05/18/2026 02:21:51
- graph.json: 29.84 MB, updated 05/18/2026 02:21:48

## Executive Overview

Nama Invest / 
amaweb is a large Multi-Tenant SaaS ERP + POS + Electron Desktop + PWA repository. The stack detected from code/config includes Next.js, React, Prisma, PostgreSQL, TypeScript, Electron, Redis/BullMQ patterns, Sentry, Zod, and Saudi compliance/ZATCA modules.

## Sales Invoice Lifecycle

Evidence: /api/sales, /api/pos, src/services/sales/*, src/lib/services/outbox.service.ts, ZATCA libraries.

Sequence:
1. Request enters sales/POS API.
2. Tenant/auth context should be resolved by withRoute.
3. Route/service validates request; exact schema is route-specific or UNKNOWN.
4. Invoice/customer/product/payment actions occur.
5. Depending on route, inventory, accounting, outbox, and ZATCA side effects may occur.
6. Transaction boundary must be checked in API_MAP for $transaction or 
unFinancialTx.

Failure points: duplicate invoice, stock mismatch, journal mismatch, ZATCA failure, payment callback duplication.

## Purchase Lifecycle

Evidence: /api/purchases, /api/purchase-orders, /api/grn, src/services/purchases/*, src/lib/workflow/saga/purchase-sagas.ts.

Sequence: requisition/order/GRN/invoice/payment behavior is path/domain-derived; exact route behavior is UNKNOWN until each route is read.

Failure points: duplicate GRN, missing 3-way match, AP/inventory mismatch.

## Inventory Movement

Evidence: /api/stock*, /api/inventory, /api/warehouses, src/services/inventory/*, src/lib/inventory-engine.ts.

Rule: every quantity-changing path should be reviewed for stock movement records and costing/accounting side effects.

## Auto Journal Posting & Period Lock

Evidence: `src/lib/auto-journal.ts`, `src/lib/accounting-engine.ts`, `src/services/accounting/journal.service.ts`, `src/services/accounting/financial-period.service.ts`.

Rule: double-entry must balance. Posted/closed-period mutation is high risk.
**Period Lock Workflow**:
1. Business action (e.g., Payment, Payroll) defines its actual transactional `businessDate`.
2. Action wraps inside `prisma.$transaction`.
3. `FinancialPeriodService` instantiates with `tx` and calls `requireOpenPeriod(businessDate)`.
4. If period is locked, the entire transaction atomically rolls back.

## ZATCA Reporting

Evidence: src/services/zatca/*, src/lib/zatca*, /api/zatca/*, cron references.

Steps generally include onboarding/certificate, XML/QR/signing, clearance/reporting, status persistence, retry/recovery. Exact implementation is file-specific.

## Authentication / Tenant Context

Evidence: middleware.ts, src/proxy.ts, src/lib/auth.ts, src/lib/api/with-route.ts, src/lib/prisma.ts.

Sequence: middleware/proxy -> route wrapper -> JWT/role/tenant validation -> tenant-aware Prisma -> handler.

## Tenant Onboarding

Evidence: /api/tenant/*, src/lib/product/tenant-onboarding-engine.ts, ICE/subscription/license APIs.

Exact provisioning behavior is UNKNOWN until tenant routes are traced.

## Audit / Outbox

Evidence: src/lib/prisma-audit.ts, src/lib/audit*, src/lib/services/outbox.service.ts, src/workers/outbox/outbox-relay.worker.ts.

Rule: events should carry tenant context and support retry/idempotency where durable side effects are involved.
