const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const aiBrainDir = path.join(rootDir, 'docs', 'ai-brain');

if (!fs.existsSync(aiBrainDir)) {
    fs.mkdirSync(aiBrainDir, { recursive: true });
}

// Helpers
function walk(dir, ext) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    for (const file of fs.readdirSync(dir)) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !full.includes('node_modules') && !full.includes('.next') && !full.includes('.git')) {
            results = results.concat(walk(full, ext));
        } else if (full.endsWith(ext)) {
            results.push(full);
        }
    }
    return results;
}

function getDirectories(srcPath) {
    if (!fs.existsSync(srcPath)) return [];
    return fs.readdirSync(srcPath).filter(file => fs.statSync(path.join(srcPath, file)).isDirectory() && !file.includes('node_modules') && !file.includes('.next') && !file.includes('.git'));
}

const timestamp = new Date().toISOString();

// ==========================================
// 1. PROJECT_BRAIN.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'PROJECT_BRAIN.md'), `
# Project Brain: Executive Overview
**Generated At:** ${timestamp}

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
- **Financial Integrity:** Split-brain between invoices and journals. (Mitigated via strict \`txClient\` usage).
- **Tenant Isolation:** Cross-tenant data leakage. (Mitigated via \`tenantId\` guards).
- **Schema Migrations:** Modifying historic migrations breaks shadow DB.

## Important Notes
- Always check \`FINANCIAL_INTEGRITY.md\` before touching financial operations.
- ZATCA operations must use the Outbox pattern (\`EventLog\`).
`);

// ==========================================
// 2. SYSTEM_MAP.md
// ==========================================
const srcFolders = getDirectories(path.join(rootDir, 'src'));
fs.writeFileSync(path.join(aiBrainDir, 'SYSTEM_MAP.md'), `
# System Map
**Generated At:** ${timestamp}

## Full Folder Structure
- \`/src/app\`: Next.js App Router UI and API.
- \`/src/components\`: Shared React UI.
- \`/src/lib\`: Core utilities, Prisma client, Idempotency logic, ZATCA SDK.
- \`/prisma\`: Database schema and migrations.
- \`/docs/ai-brain\`: This memory system.
- \`/.agent\`: Workflow and agent rules.

## Entry Points
- \`src/app/page.tsx\`: Landing page.
- \`src/app/(dashboard)\`: Main ERP Tenant UI.
- \`src/app/ice\`: Master Control Panel.
- \`src/app/api\`: Backend microservices.

## Shared Libraries
- \`src/lib/prisma.ts\`: DB connection and Tenant Guards.
- \`src/lib/idempotency.ts\`: Request deduplication.

## Deprecated Areas
- \`src/app/(dashboard)/_ice_archive\`: Old route safely archived to avoid collisions.
`);

// ==========================================
// 3. DOMAIN_MAP.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'DOMAIN_MAP.md'), `
# Domain Map
**Generated At:** ${timestamp}

## 1. Accounting Domain
- **Purpose:** Double-entry journal system.
- **Dependencies:** Sales, Purchases, Treasury.
- **Rules:** Must balance. Auto-journals generated synchronously inside transaction.

## 2. Sales & POS Domain
- **Purpose:** B2B/B2C invoicing and retail.
- **Rules:** Must deduct inventory and create journal. Idempotency enforced.

## 3. Purchases Domain
- **Purpose:** Procurement lifecycle (PR -> PO -> GRN -> Bill).
- **Rules:** 3-way matching. Strict transaction atomicity required.

## 4. ZATCA Domain
- **Purpose:** KSA Tax Authority E-Invoicing.
- **Rules:** Asynchronous XML generation. Never block the main API thread.

## 5. Tenant Management (ICE)
- **Purpose:** SaaS lifecycle, trials, onboarding.
- **Rules:** Master DB context separated from Tenant context.
`);

// ==========================================
// 4. DATABASE_MAP.md
// ==========================================
const schemaContent = fs.existsSync(path.join(rootDir, 'prisma/schema.prisma')) ? fs.readFileSync(path.join(rootDir, 'prisma/schema.prisma'), 'utf-8') : '';
const modelCount = (schemaContent.match(/model\s+\w+/g) || []).length;
fs.writeFileSync(path.join(aiBrainDir, 'DATABASE_MAP.md'), `
# Database Map
**Generated At:** ${timestamp}

## Overview
- **Total Models:** ${modelCount}
- **ORM:** Prisma

## Financial Integrity Features
- \`IdempotencyRecord\`: Enforces unique [tenantId, endpoint, key] to prevent duplicate executions.
- \`JournalEntry\` & \`JournalDetails\`: Core accounting engine.
- \`Account\`: Chart of Accounts.

## Tenant Isolation
- Almost all tables have a \`tenantId\` String field.
- \`prisma.ts\` uses a global middleware to intercept \`findMany\`, \`update\`, \`delete\` and forcefully inject the context's \`tenantId\`.

## Missing Constraints / Risky Schemas
- Floating point values must be avoided for financial fields (use \`Decimal\` or Integer Cents).
- Hard deletes are mostly avoided via \`deletedAt\` soft deletes.
`);

// ==========================================
// 5. API_MAP.md
// ==========================================
const apiRoutes = walk(path.join(rootDir, 'src/app/api'), 'route.ts');
fs.writeFileSync(path.join(aiBrainDir, 'API_MAP.md'), `
# API Map
**Generated At:** ${timestamp}

## Total Routes Discovered: ${apiRoutes.length}

### Critical Endpoints
- \`POST /api/sales\`: Creates Sales Invoice. Protected by \`withIdempotency\`. Generates Journal.
- \`POST /api/purchases\`: Creates Purchase Invoice. Protected by \`withIdempotency\`. Generates Journal.
- \`POST /api/zatca/sign\`: Signs XML payloads for Phase 2.
- \`GET /api/ice/master-panel-data\`: Retrieves tenant statistics.

## Standards
- **Authentication:** Middleware + Clerk.
- **Transactions:** \`prisma.$transaction\` used for multi-table inserts.
- **Error Handling:** Centralized JSON responses with HTTP status codes.
`);

// ==========================================
// 6. WORKFLOWS.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'WORKFLOWS.md'), `
# Workflows
**Generated At:** ${timestamp}

## Sales Invoice Lifecycle
1. User submits invoice.
2. \`withIdempotency\` intercepts to check for duplicate \`Idempotency-Key\`.
3. \`prisma.$transaction\` begins.
4. \`SalesInvoice\` inserted.
5. Inventory deducted (\`StockMovement\`).
6. \`createJournalEntry\` called inside transaction.
7. Audit Log recorded.
8. ZATCA Event added to \`EventLog\` (Outbox pattern).
9. Transaction commits.

## Idempotency Flow
- Check DB for existing \`[tenantId, endpoint, key]\`.
- If \`COMPLETED\`, return cached response.
- If \`IN_PROGRESS\`, return 409 Conflict.
- Run handler -> Update record on success/fail.
`);

// ==========================================
// 7. SECURITY_AND_TENANT_ISOLATION.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'SECURITY_AND_TENANT_ISOLATION.md'), `
# Security & Tenant Isolation
**Generated At:** ${timestamp}

## Tenant Isolation
- Implemented primarily via Prisma Extension/Middleware in \`src/lib/prisma.ts\`.
- \`tenant-guard\`: Automatically appends \`tenantId: currentTenant\` to \`where\` clauses.
- **Risk:** Raw queries (\`$queryRaw\`) bypass this guard. Must manually append \`tenantId\`.

## Authentication
- Handled by Clerk SSO.
- Middleware (\`middleware.ts\`) protects \`/(dashboard)\` routes and injects tenant session.
- \`/sso-callback\` handles infinite redirect loops safely.
`);

// ==========================================
// 8. FINANCIAL_INTEGRITY.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'FINANCIAL_INTEGRITY.md'), `
# Financial Integrity
**Generated At:** ${timestamp}

## Core Principles
1. **Zero Split-Brain:** All financial operations must occur inside a single atomic transaction. An invoice must never exist without its corresponding journal entry, and vice-versa.
2. **TxClient Injection:** Any service function that performs database updates (like \`createJournalEntry\`) MUST accept a \`txClient\` (Prisma Transaction Client) and use it exclusively.
3. **Hard Failures (Throw Errors):** Do not return soft \`{ success: false }\` inside atomic transactions. Throwing forces rollback.
4. **Outbox Pattern:** External API calls (like ZATCA) must NEVER be made synchronously inside a financial transaction.

## Release Operations & Database Safety
- Modifying applied historic migrations is strictly prohibited.
- Use \`npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script\` to safely generate diffs bypassing broken shadow DBs.
`);

// ==========================================
// 9. INTEGRATIONS.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'INTEGRATIONS.md'), `
# Integrations
**Generated At:** ${timestamp}

## ZATCA (FATOORA)
- **Purpose:** KSA Phase 2 E-Invoicing.
- **Flow:** Outbox pattern. XML generated asynchronously.
- **Failure Handling:** Dead-letter queues for retries.

## Clerk
- **Purpose:** Auth & SSO.
- **Flow:** JWT validation via JWKS.
`);

// ==========================================
// 10. ENVIRONMENT_AND_CONFIG.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'ENVIRONMENT_AND_CONFIG.md'), `
# Environment & Config
**Generated At:** ${timestamp}

## Required Variables
- \`DATABASE_URL\`: PostgreSQL connection.
- \`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\` / \`CLERK_SECRET_KEY\`
- \`ZATCA_API_KEY\` (Optional depending on environment)

## Build Configs
- Next.js Turbopack enabled.
- Standalone output enabled in \`next.config.ts\`.
`);

// ==========================================
// 11. TESTING_STRATEGY.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'TESTING_STRATEGY.md'), `
# Testing Strategy
**Generated At:** ${timestamp}

## Current Status
- Unit tests run via Jest + ts-jest.
- E2E via Playwright.

## Financial Integrity Tests
- Must assert that failing inventory rolls back the invoice.
- Idempotency tests must assert 409 Conflict on parallel requests.

## How to run
- \`npm run test:unit\`
- \`npx tsc --noEmit\` (Critical gatekeeper for CI builds)
`);

// ==========================================
// 12. PERFORMANCE_AND_SCALING.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'PERFORMANCE_AND_SCALING.md'), `
# Performance & Scaling
**Generated At:** ${timestamp}

## Known Bottlenecks
- Synchronous auto-journal creation can add 100-200ms to invoice saving. Acceptable for atomicity.
- ZATCA must be asynchronous. Do not block the user waiting for Fatoora clearance.

## Caching Opportunities
- Next.js App Router aggressively caches. Watch out for stale data in \`(dashboard)\`.
`);

// ==========================================
// 13. KNOWN_RISKS_AND_TECH_DEBT.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'KNOWN_RISKS_AND_TECH_DEBT.md'), `
# Known Risks & Tech Debt
**Generated At:** ${timestamp}

## Legacy Routes
- \`_ice_archive\` contains legacy code. Do not revive without audit.

## Decimal Math
- JS floating point math is dangerous. Always use \`Decimal.js\` or integer cents for totals and taxes.

## Database Migrations
- The local shadow DB is corrupt due to early historic migration modifications. Future migrations MUST use \`migrate diff\` manually or reset the DB if absolutely necessary.
`);

// ==========================================
// 14. AI_AGENT_RULES.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'AI_AGENT_RULES.md'), `
# AI Agent Rules
**Generated At:** ${timestamp}

## 1. NEVER Break Atomicity
If you modify financial code, you MUST use \`prisma.$transaction\` and pass the \`tx\` client down to sub-functions.

## 2. NEVER Modify Old Migrations
Do not edit files in \`prisma/migrations\` once they are applied.

## 3. ALWAYS Scan First
Run \`tsc --noEmit\` before declaring a task "DONE".

## 4. Tenant Isolation
Never query \`findMany\` across tenants without explicit Master ICE authorization.

## 5. Idempotency
Any new financial \`POST\` or \`PUT\` endpoint must be wrapped in \`withIdempotency\`.
`);

// ==========================================
// 15. OPEN_QUESTIONS.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'OPEN_QUESTIONS.md'), `
# Open Questions
**Generated At:** ${timestamp}

1. What is the full fallback behavior if the ZATCA API is down for 48+ hours?
2. Are there any edge cases in Inventory Valuation (FIFO) that bypass the atomic journal entry?
3. Should the \`_ice_archive\` be fully deleted in the next major release?
`);

// ==========================================
// 16. CHANGELOG_AI_BRAIN.md
// ==========================================
fs.writeFileSync(path.join(aiBrainDir, 'CHANGELOG_AI_BRAIN.md'), `
# Changelog: AI Brain
**Generated At:** ${timestamp}

## Version 1.0.0
- Initial automated generation of the 16-file AI Brain structure.
- Extracted system overview, financial integrity rules, idempotency logic, and tenant isolation constraints.
`);

// ==========================================
// ROOT: AI_PROJECT_MEMORY.md
// ==========================================
fs.writeFileSync(path.join(rootDir, 'AI_PROJECT_MEMORY.md'), `
# AI Project Memory
**Generated At:** ${timestamp}

## Welcome, AI Agent!
You are operating inside **Nama Invest ERP**. This system is highly complex, multi-tenant, and financially sensitive.
Before writing any code, YOU MUST read the relevant files in the \`docs/ai-brain\` directory.

## Core Directories
- \`/docs/ai-brain/PROJECT_BRAIN.md\`: Executive Overview
- \`/docs/ai-brain/SYSTEM_MAP.md\`: Architecture & Folders
- \`/docs/ai-brain/DOMAIN_MAP.md\`: Business Domains
- \`/docs/ai-brain/FINANCIAL_INTEGRITY.md\`: ⚠️ CRITICAL FINANCIAL RULES
- \`/docs/ai-brain/AI_AGENT_RULES.md\`: ⚠️ CRITICAL AGENT INSTRUCTIONS

## Your Mandate
1. Check the Brain.
2. Write Code.
3. Validate via \`tsc --noEmit\`.
4. Update the Brain if architecture changes.
`);

console.log('✅ AI Project Brain successfully generated.');
