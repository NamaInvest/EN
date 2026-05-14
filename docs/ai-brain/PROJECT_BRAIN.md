
# Project Brain: Executive Overview
**Generated At:** 2026-05-14T08:21:09.109Z

## Executive Overview
Nama Invest ERP (formerly NamaSoft) is a highly complex, multi-tenant enterprise resource planning (ERP) system encompassing Web (Next.js), Desktop (Electron/Qt6), and Mobile interfaces.

## System Purpose
To provide comprehensive business management including Sales, POS, Purchasing, Inventory, Accounting, ZATCA Phase 1/2 E-Invoicing, HR/Payroll, and specialized modules (Medical, Construction, School) in a multi-tenant SaaS environment.

## Architecture Summary
- **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS, shadcn/ui.
- **Backend:** Next.js Route Handlers + Express Monolith integration.
- **Database:** PostgreSQL (via Prisma ORM 5.22+).
- **Authentication:** Clerk + Custom JWT MFA.
- **Architecture Pattern:** Multi-tenant isolated tables, atomic financial transactions, asynchronous ZATCA queuing.

## Main Modules
- Accounting & Finance (Double-entry, Auto-Journals)
- Sales & POS (KDS, Mada integration)
- Purchases (PR, PO, GRN)
- Inventory Management (FIFO, Valuations)
- ZATCA Integration (Phase 1 & 2)

## Critical Risks
- **Financial Integrity:** Split-brain between invoices and journals. (Mitigated via strict `txClient` usage).
- **Tenant Isolation:** Cross-tenant data leakage. (Mitigated via `tenantId` guards).
- **Schema Migrations:** Modifying historic migrations breaks shadow DB.

## Important Notes
- Always check `FINANCIAL_INTEGRITY.md` before touching financial operations.
- ZATCA operations must use the Outbox pattern (`EventLog`).
