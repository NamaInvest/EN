# PROJECT BRAIN: Nama Invest ERP

## Executive Overview
Nama Invest ERP is a multi-tenant Enterprise Resource Planning (ERP) and Point of Sale (POS) system built on Next.js, Prisma, and PostgreSQL. It unifies operations across accounting, sales, purchasing, inventory, HR, and manufacturing.

## System Purpose
To provide a reliable, ACID-compliant, ZATCA-ready financial and operational backend for businesses. The system uses strict tenant isolation (`tenantId`), enforcing data integrity across highly concurrent environments.

## Architecture Summary
- **Frontend:** Next.js App Router, React, Tailwind, shadcn/ui.
- **Backend:** Next.js Edge/Node API Routes.
- **Database:** PostgreSQL (Prisma ORM).
- **Authentication:** Clerk & Custom API Keys with rigorous JWT and middleware guards.
- **Transactions:** Centralized `runFinancialTx` and `runInventoryTx` wrappers for atomicity.

## Main Modules
- Accounting & Treasury (GL, AR, AP, Recon)
- Sales & POS (Web & Desktop offline sync)
- Purchases & Inventory (WMS, Procurement)
- HR & Payroll (WPS, GOSI)
- Manufacturing (MRP, Shopfloor)
- CRM & Specialized Verticals (Clinics, Schools, Real Estate)

## Critical Risks
- **Financial Integrity:** Split-brain accounting if non-atomic writes occur. Always use `runFinancialTx`.
- **Tenant Leakage:** Missing `tenantId` in WHERE clauses can expose cross-tenant data.
- **ZATCA Compliance:** Phase 2 requires strict cryptographic sequencing. Do not delete posted journals or ZATCA cleared invoices.
