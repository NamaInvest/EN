
# AI Project Memory
**Generated At:** 2026-05-14T11:46:55.234Z

## Welcome, AI Agent!
You are operating inside **Nama Invest ERP**. This system is highly complex, multi-tenant, and financially sensitive.
Before writing any code, YOU MUST read the relevant files in the `docs/ai-brain` directory.

## Core Directories
- `/docs/ai-brain/PROJECT_BRAIN.md`: Executive Overview
- `/docs/ai-brain/SYSTEM_MAP.md`: Architecture & Folders
- `/docs/ai-brain/DOMAIN_MAP.md`: Business Domains
- `/docs/ai-brain/FINANCIAL_INTEGRITY.md`: ⚠️ CRITICAL FINANCIAL RULES
- `/docs/ai-brain/AI_AGENT_RULES.md`: ⚠️ CRITICAL AGENT INSTRUCTIONS

## Architectural Updates Log
- **2026-05-14**: Refactored `Purchase Returns` module for strict atomicity. Integrated `withIdempotency`, executed journal posting inside Prisma `$transaction`, added dynamic details/items parsing with hard inventory deductions (`product.currentStock`, `productStock`, `stockMovement`), and enforced tenant-level validation for parent invoices.
- **2026-05-14**: Refactored `Sales Returns` module to enforce atomic financial integrity. Integrated `withIdempotency` wrapper, established exact tenant scoping, restored missing stock movement tracking, executed `postSalesReturn` journal entry synchronously within Prisma `$transaction`, and eliminated `.catch(() => null)` masked errors. ZATCA Event Outbox added as a TODO.
- **2026-05-14**: Refactored `Sales` inventory module. Eliminated swallowed errors inside Prisma transaction (`productStock.upsert`, `stockMovement.create`). Any inventory failure now safely rolls back the entire invoice and treasury record.

## Your Mandate
1. Check the Brain.
2. Write Code.
3. Validate via `tsc --noEmit`.
4. Update the Brain if architecture changes.
