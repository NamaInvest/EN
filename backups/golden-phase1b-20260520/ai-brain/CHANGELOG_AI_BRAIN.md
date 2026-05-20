# CHANGELOG: AI BRAIN

## [2026-05-18] - Financial Governance Program Complete
- **Added**: `FINANCIAL_GOVERNANCE_RULES.md` documenting strict period lock and fiscal integrity rules.
- **Updated**: `SYSTEM_MAP.md`, `DOMAIN_MAP.md`, `SECURITY_AND_TENANT_ISOLATION.md`, `FINANCIAL_INTEGRITY.md`, `WORKFLOWS.md` updated to reflect the new Financial Period Lock Architecture.
- **Hardened**: Period lock governance implemented across Sales, Purchases, Returns, Treasury, Inventory (Adjustments & Cycle Counts), Payroll, and Year-End Closing.
- **Enforced**: Strict Transaction Atomicity (`requireOpenPeriod` inside `prisma.$transaction`), Tenant Isolation on Reopen/Year-End, and Zero-Date Defaulting rules.

## [2026-05-18] - Project Brain Phase 2 Complete
- **Added**: Comprehensive Project Brain architecture established under `/docs/ai-brain/`.
- **Added**: `PROJECT_BRAIN.md`, `SYSTEM_MAP.md`, `DOMAIN_MAP.md`, `DATABASE_MAP.md`, `API_MAP.md`.
- **Added**: `WORKFLOWS.md`, `SECURITY_AND_TENANT_ISOLATION.md`, `FINANCIAL_INTEGRITY.md`, `INTEGRATIONS.md`.
- **Added**: `ENVIRONMENT_AND_CONFIG.md`, `TESTING_STRATEGY.md`, `PERFORMANCE_AND_SCALING.md`.
- **Added**: `KNOWN_RISKS_AND_TECH_DEBT.md`, `AI_AGENT_RULES.md`, `OPEN_QUESTIONS.md`.
- **Hardened**: Marked specific areas (Treasury Phase A, FX Gains, Sales/Purchase returns) as Baseline Stable.
- **Enforced**: "Scan First" rule and Incremental Consistency Audit Mode.

## [2026-05-17] - Phase 3.2 Outbox Reliability Snapshot
- **Updated**: Documented `PharmacyPayloadSanitizer` creation and strict PII/PHI guarding.
- **Updated**: Outbox diagnostics API (`/api/admin/outbox/diagnostics`) mapped as read-only observability endpoints.

*Note: This file must be appended to after every major architectural shift or phase completion.*
