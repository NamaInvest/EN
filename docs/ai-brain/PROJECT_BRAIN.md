# PROJECT BRAIN

## Executive Overview
Nama Invest ERP is a comprehensive, multi-tenant enterprise resource planning (ERP) and point-of-sale (POS) system. It seamlessly integrates accounting, inventory, human resources, payroll, medical clinic management (pharmacy, labs), manufacturing, and regional compliance (like ZATCA e-invoicing for Saudi Arabia). Built with scalability and security in mind, it targets medium to large enterprises needing robust financial integrity, deep compliance, and modular expandability.

## System Purpose
The primary purpose of the system is to provide a unified operational backbone for diverse business domains. It ensures strict data isolation across tenants while enabling real-time financial reporting, compliance with local tax authorities (ZATCA Phase 1 & 2), and precise inventory/asset tracking. The system is designed to be highly reliable, utilizing transactional atomicity, idempotent integrations, and a robust Outbox pattern for event-driven workflows.

## Architecture Summary
- **Backend**: Next.js App Router (API routes) with a modular service architecture, plus an Express fallback for legacy/monolith maintenance.
- **Database**: PostgreSQL accessed via Prisma ORM.
- **Background Processing**: BullMQ backed by Redis for asynchronous tasks (e.g., ZATCA reporting, Webhooks).
- **Event Bus**: Outbox pattern implemented via Prisma transactions to guarantee atomic event dispatch without split-brain issues.
- **Frontend**: Next.js (React) for the web application.
- **Desktop**: Electron and Qt6 versions available for POS scenarios with offline sync capabilities.
- **Tenant Management**: Granular isolation where `tenantId` is strictly enforced at the application and database levels. Master Admin (ICE) manages global tenants.

## Main Modules
- **Accounting & Finance**: General Ledger, AP, AR, Budgeting, Bank Reconciliation, Asset Management.
- **Sales & POS**: Retail and POS integration, order management, quotes, subscriptions.
- **Purchases & Inventory**: Supplier management, purchase orders, advanced warehouse management (WMS), ATP checks.
- **Human Resources (HR) & Payroll**: Employee lifecycle, attendance, payroll runs, GOSI sync, Mudad integration, ESS (Employee Self-Service).
- **Manufacturing**: Bills of Material (BOM), Work Orders, production cycles, shop floor control.
- **Medical / Pharmacy**: Patient records, prescriptions, medical dispensing with strict PII/HIPAA compliance, lab orders.
- **Compliance & Localizations**: ZATCA E-Invoicing Phase 2, WHT, PDPL (Personal Data Protection Law).

## Critical Risks
- **Financial Integrity (Split-Brain)**: Ensuring inventory/HR events perfectly align with general ledger postings. Protected via strict Domain Transactions (`runFinancialTx`, `runInventoryTx`).
- **Tenant Leakage**: Unintended cross-tenant data exposure. Prevented by global `requireTenantId` guardrails and banning default tenant assumptions.
- **PII/PHI Leakage**: Exposure of patient/employee sensitive data in asynchronous queues. Mitigated by `PharmacyPayloadSanitizer` and worker-level guards.
- **Double Processing**: Duplicate job execution leading to double dispensing or duplicate journals. Managed via idempotent keys and pessimistic database locking (`updateMany` lock).

## Important Notes
- **Golden Rule**: No raw `prisma.$transaction` calls should be exposed directly in API routes. All transactions must be encapsulated within domain service classes.
- **Outbox Rule**: All cross-domain events (e.g., Inventory -> Accounting, Pharmacy -> Notification) must utilize `OutboxEvent` creation inside the exact same database transaction as the primary mutation.
- Future AI Agents must ALWAYS consult `/docs/ai-brain` before making architectural or transactional changes.
