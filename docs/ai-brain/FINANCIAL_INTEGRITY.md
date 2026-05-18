# Financial Integrity

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

## Confirmed Financial Areas

- Accounting APIs under /api/accounting, /api/finance, /api/treasury.
- Financial libraries/services: src/lib/accounting-engine.ts, src/lib/auto-journal.ts, src/services/accounting/*, src/lib/security/journal-validation-layer.ts.
- Sales/POS/purchase/inventory routes can have financial side effects.

## Core Invariants

- Debit total must equal credit total.
- Posted journals and closed periods MUST NOT be modified directly.
- Financial Period Lock Architecture is STRICTLY enforced via `FinancialPeriodService.requireOpenPeriod(date)`.
- No transactions (Journal Entries, Inventory Movements, AP/AR, Treasury, Payroll) can be backdated into a closed fiscal period.
- Cleared/reported ZATCA invoices should not be modified directly.
- Inventory movements with financial impact should be consistent with accounting postings.

## Transaction Atomicity & Period Locks

API_MAP.md flags route files where `$transaction` or `runFinancialTx` was detected. Absence of those markers does not prove absence of transaction, but it is a review risk.

**CRITICAL**: `FinancialPeriodService` must ALWAYS be executed *inside* the transaction context, passing the transactional Prisma client (`tx`) to prevent lock race conditions. Date defaulting to `new Date()` is forbidden when validating historical/business transactions.

## Split-Brain Risks

- Invoice committed but journal/stock/ZATCA failed.
- Stock changed but accounting not posted.
- Payment allocated twice without idempotency.
- ZATCA external call succeeds but local status update fails.

## Required Safeguards

- Use DB transactions for local multi-write financial operations.
- Use outbox/queue for external side effects.
- Add financial tests for sales, purchases, inventory valuation, payroll, treasury, VAT/ZATCA.
