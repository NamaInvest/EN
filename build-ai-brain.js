const fs = require('fs');
const path = require('path');

const BRAIN_DIR = path.join(__dirname, 'docs', 'ai-brain');
if (!fs.existsSync(BRAIN_DIR)) {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
}

// Data Extraction
const schemaStr = fs.existsSync('prisma/schema.prisma') ? fs.readFileSync('prisma/schema.prisma', 'utf8') : '';
const srcFilesTxt = fs.existsSync('src_files.txt') ? fs.readFileSync('src_files.txt', 'utf8') : '';
const files = srcFilesTxt.split('\n').map(f => f.trim()).filter(Boolean);

const pages = files.filter(f => f.includes('\\app\\') && (f.endsWith('page.tsx') || f.endsWith('page.jsx')));
const apis = files.filter(f => f.includes('\\api\\') && (f.endsWith('route.ts') || f.endsWith('route.js')));
const services = files.filter(f => f.includes('\\services\\') && f.endsWith('.ts'));

// Parse Models
const models = [];
if (schemaStr) {
    const lines = schemaStr.split('\n');
    let currentModel = null;
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('model ')) {
            currentModel = { name: line.split(' ')[1], fields: [], isTenantIsolated: false, hasFinancial: false };
            models.push(currentModel);
        } else if (line.startsWith('}')) {
            currentModel = null;
        } else if (currentModel && line && !line.startsWith('//')) {
            currentModel.fields.push(line);
            if (line.includes('tenantId')) currentModel.isTenantIsolated = true;
            if (line.includes('amount') || line.includes('Debit') || line.includes('Credit')) currentModel.hasFinancial = true;
        }
    }
}

const write = (filename, content) => fs.writeFileSync(path.join(BRAIN_DIR, filename), content, 'utf8');
const writeRoot = (filename, content) => fs.writeFileSync(path.join(__dirname, filename), content, 'utf8');

// 1. PROJECT_BRAIN.md
write('PROJECT_BRAIN.md', `# PROJECT BRAIN: Nama Invest ERP

## Executive Overview
Nama Invest ERP is a multi-tenant Enterprise Resource Planning (ERP) and Point of Sale (POS) system built on Next.js, Prisma, and PostgreSQL. It unifies operations across accounting, sales, purchasing, inventory, HR, and manufacturing.

## System Purpose
To provide a reliable, ACID-compliant, ZATCA-ready financial and operational backend for businesses. The system uses strict tenant isolation (\`tenantId\`), enforcing data integrity across highly concurrent environments.

## Architecture Summary
- **Frontend:** Next.js App Router, React, Tailwind, shadcn/ui.
- **Backend:** Next.js Edge/Node API Routes.
- **Database:** PostgreSQL (Prisma ORM).
- **Authentication:** Clerk & Custom API Keys with rigorous JWT and middleware guards.
- **Transactions:** Centralized \`runFinancialTx\` and \`runInventoryTx\` wrappers for atomicity.

## Main Modules
- Accounting & Treasury (GL, AR, AP, Recon)
- Sales & POS (Web & Desktop offline sync)
- Purchases & Inventory (WMS, Procurement)
- HR & Payroll (WPS, GOSI)
- Manufacturing (MRP, Shopfloor)
- CRM & Specialized Verticals (Clinics, Schools, Real Estate)

## Critical Risks
- **Financial Integrity:** Split-brain accounting if non-atomic writes occur. Always use \`runFinancialTx\`.
- **Tenant Leakage:** Missing \`tenantId\` in WHERE clauses can expose cross-tenant data.
- **ZATCA Compliance:** Phase 2 requires strict cryptographic sequencing. Do not delete posted journals or ZATCA cleared invoices.
`);

// 2. SYSTEM_MAP.md
write('SYSTEM_MAP.md', `# SYSTEM MAP

## Folder Structure
- \`src/app/(dashboard)\`: Main UI pages for all ERP modules.
- \`src/app/api\`: Backend API endpoints.
- \`src/lib/services\`: Core business logic (Accounting Engine, Inventory Service, etc.).
- \`src/middleware.ts\`: Authentication and tenant subdomain resolution guard.
- \`prisma/schema.prisma\`: Database schema definition.

## Entry Points
- Web Application: \`src/app/page.tsx\`
- Desktop App: Electron/Qt bootstrappers (via APIs).
- API Gateway: \`src/middleware.ts\` intercepts all API requests.

## Runtime Flow
Request -> Middleware (Subdomain/Tenant logic, Clerk/API Auth) -> Next.js Route Handler -> Prisma Client (wrapped in Tx) -> PostgreSQL.

## Shared Libraries
- \`runFinancialTx\`: Core atomic wrapper for financial mutations.
- \`runInventoryTx\`: Core atomic wrapper for stock mutations.
- \`ZatcaService\`: KSA e-invoicing compliance logic.
`);

// 3. DOMAIN_MAP.md
write('DOMAIN_MAP.md', `# DOMAIN MAP

## 1. Accounting & Finance
- **Purpose:** Core ledger, AR/AP, Treasury, asset depreciation.
- **APIs:** \`/api/accounting/*\`, \`/api/treasury/*\`
- **Rules:** Immutable journals. Use \`runFinancialTx\`.

## 2. Sales & POS
- **Purpose:** B2B/B2C sales, offline POS, recurring billing.
- **APIs:** \`/api/sales/*\`, \`/api/pos/*\`
- **Rules:** Invoices must integrate with ZATCA Phase 2.

## 3. Purchases & Inventory
- **Purpose:** Procure-to-pay, WMS, stocktake, landed costs.
- **APIs:** \`/api/purchases/*\`, \`/api/inventory/*\`, \`/api/stock/*\`
- **Rules:** Use \`runInventoryTx\`. FIFO valuation.

## 4. HR & Payroll
- **Purpose:** Employee lifecycle, WPS, GOSI, attendance.
- **APIs:** \`/api/hr/*\`, \`/api/salaries/*\`
- **Rules:** Salary generation must atomically post to Treasury & GL.

## 5. ZATCA
- **Purpose:** KSA Phase 1 & 2 e-invoicing.
- **Rules:** Cryptographic hash chaining. Do not alter generated XMLs.

## 6. Tenant Management (ICE)
- **Purpose:** SaaS subscription and licensing.
- **APIs:** \`/api/master-panel/*\`
- **Rules:** Subdomain routing and module limiting.
`);

// 4. DATABASE_MAP.md
let dbMap = `# DATABASE MAP\n\n`;
dbMap += `## Global Rules\n`;
dbMap += `- **Tenant Isolation:** Most tables have \`tenantId\`.\n`;
dbMap += `- **Soft Deletes:** Often uses \`status\` flags rather than physical deletion.\n\n`;
dbMap += `## Discovered Models (${models.length})\n`;
models.forEach(m => {
    dbMap += `### ${m.name}\n`;
    dbMap += `- Tenant Isolated: ${m.isTenantIsolated ? 'Yes' : 'No'}\n`;
    dbMap += `- Contains Financial Fields: ${m.hasFinancial ? 'Yes' : 'No'}\n`;
    dbMap += `\n`;
});
write('DATABASE_MAP.md', dbMap);

// 5. API_MAP.md
let apiMap = `# API MAP\n\n`;
apiMap += `Total APIs Discovered: ${apis.length}\n\n`;
apiMap += `## Core Rules\n`;
apiMap += `- **Authentication:** Handled by \`middleware.ts\` via JWT or API Key.\n`;
apiMap += `- **Tenant Requirements:** \`x-tenant-id\` injected by middleware. Must be used in all Prisma queries.\n\n`;
apiMap += `## List of API Endpoints\n`;
apis.forEach(a => {
    apiMap += `- \`/${a.replace(/\\\\/g, '/').replace('src/app/api/', 'api/').replace('/route.ts', '').replace('/route.js', '')}\`\n`;
});
write('API_MAP.md', apiMap);

// 6. WORKFLOWS.md
write('WORKFLOWS.md', `# WORKFLOWS

## 1. Sales Invoice Lifecycle
1. User creates an invoice in the UI.
2. API validates stock availability.
3. \`runFinancialTx\` triggers:
   a. Stock reduction.
   b. Invoice creation.
   c. GL Journal Entry creation (AR Debit, Revenue Credit).
   d. ZATCA XML Generation (if KSA applicable).

## 2. Purchase Lifecycle
1. PO created.
2. Goods Received Note (GRN) triggers \`runInventoryTx\`.
3. Invoice matching triggers \`runFinancialTx\`.

## 3. ZATCA Reporting
1. Invoice finalised.
2. ZATCA service signs XML.
3. API submits to FATOORA portal.
4. Cleared status updated atomically.
`);

// 7. SECURITY_AND_TENANT_ISOLATION.md
write('SECURITY_AND_TENANT_ISOLATION.md', `# SECURITY AND TENANT ISOLATION

## Authentication Architecture
- Relies on Clerk for identity.
- Local SSO mappings route users to the correct \`tenantId\`.

## Tenant Context Flow
1. Middleware reads Host header or Token.
2. Injects \`x-tenant-id\` and \`x-tenant-subdomain\` to Headers.
3. API routes extract \`x-tenant-id\`.
4. Prisma queries MUST include \`where: { tenantId }\`.

## Risks
- Missing \`tenantId\` in any Prisma query leads to severe cross-tenant data leakage.
`);

// 8. FINANCIAL_INTEGRITY.md
write('FINANCIAL_INTEGRITY.md', `# FINANCIAL INTEGRITY

## Atomicity Requirements
- All financial side-effects MUST be enclosed in \`runFinancialTx(prisma, async (tx) => { ... })\`.
- Prevents split-brain scenarios (e.g., stock reduced but invoice creation fails).

## Idempotency
- Use \`x-idempotency-key\` in headers for payment endpoints to prevent double-charging or double-posting.

## Golden Rules
- **DO NOT** delete posted journals.
- **DO NOT** bypass the Accounting Engine.
`);

// 9. INTEGRATIONS.md
write('INTEGRATIONS.md', `# INTEGRATIONS

## 1. ZATCA
- KSA E-Invoicing. Phase 2 (Clearance & Reporting).
- Extreme caution: Cryptographic signatures require strict order.

## 2. Payment Gateways
- Mada / Local Gateways for POS.
- Webhooks must be wrapped in Idempotency & \`runFinancialTx\`.

## 3. E-commerce Sync (Salla, etc.)
- Webhooks incoming must deduct stock and update treasury atomically.
`);

// 10. ENVIRONMENT_AND_CONFIG.md
write('ENVIRONMENT_AND_CONFIG.md', `# ENVIRONMENT AND CONFIG

## Key Variables
- \`DATABASE_URL\`: Primary Postgres connection.
- \`JWT_SECRET\`: Core secret for decoding auth tokens and ICE sessions.
- \`CLERK_SECRET_KEY\`: For tenant user sync.
- \`CRON_SECRET\`: Protects cron APIs.

## Configs
- \`next.config.ts\`: Handles CSP, bundle splitting, and Electron custom outputs.
`);

// 11. TESTING_STRATEGY.md
write('TESTING_STRATEGY.md', `# TESTING STRATEGY

## Approach
- **TypeScript:** \`npx tsc --noEmit\` strictly enforced.
- **Linting:** Standard Next.js rules.
- **Unit/Integration:** Run via standard Jest / Mocha setups if available.

## AI Agent Requirement
- Run \`npx tsc --noEmit\` after ANY structural modification.
`);

// 12. PERFORMANCE_AND_SCALING.md
write('PERFORMANCE_AND_SCALING.md', `# PERFORMANCE AND SCALING

- Large tenant tables must index by \`tenantId\`.
- Financial transaction wrappers (\`runFinancialTx\`) should be kept lightweight to prevent database locking.
- Reports should utilize aggregate queries or async background generation for multi-year ledgers.
`);

// 13. KNOWN_RISKS_AND_TECH_DEBT.md
write('KNOWN_RISKS_AND_TECH_DEBT.md', `# KNOWN RISKS AND TECH DEBT

- Over-reliance on monolithic Prisma schema; schema file is massive.
- Direct database writes without \`runFinancialTx\` might still exist in legacy modules (require ongoing audit).
- Dangerous \`any\` types in TypeScript can cause runtime failures.
`);

// 14. AI_AGENT_RULES.md
write('AI_AGENT_RULES.md', `# AI AGENT RULES

## Mandatory Operating Mode
1. **DEEP SCAN LEVEL 3:** Never write code before doing a full search.
2. **Read-only First:** Create a plan and wait for user approval unless explicitly told otherwise.
3. **Financial Protection:** Any change to accounting, invoices, treasury, or inventory MUST use \`runFinancialTx\` or \`runInventoryTx\`.
4. **Tenant Protection:** \`tenantId\` must be explicitly provided in every Prisma operation.

## Forbidden Actions
- No \`rm -rf\`, \`DROP DATABASE\`, or \`prisma db push --force-reset\` without explicit permission.
- No modifying posted journals or ZATCA cleared invoices.
- No bypassing \`tenantId\`.

## Definition of Done
- TypeScript compiles cleanly.
- Transaction boundaries are intact.
- AI Project Memory is updated.
`);

// 15. OPEN_QUESTIONS.md
write('OPEN_QUESTIONS.md', `# OPEN QUESTIONS

- Full coverage of legacy ERP modules into the new Atomic Transaction wrappers needs continuous verification.
- Offline desktop sync conflict resolution strategies (Edge cases during network disconnect).
`);

// 16. CHANGELOG_AI_BRAIN.md
write('CHANGELOG_AI_BRAIN.md', `# CHANGELOG: AI BRAIN

## ${new Date().toISOString()}
- Initial creation of the AI Project Brain by AI Agent.
- Scanned ${models.length} models, ${apis.length} APIs, ${pages.length} Pages.
`);

// Root File: AI_PROJECT_MEMORY.md
writeRoot('AI_PROJECT_MEMORY.md', `# AI PROJECT MEMORY

## Welcome AI Agent
You are operating within **Nama Invest ERP**, a complex, financial-grade Enterprise Resource Planning platform.

## Your Brain Location
All deep architectural context, rules, and system maps are located in \`/docs/ai-brain/\`.

### Index of Knowledge:
1. [Project Brain](./docs/ai-brain/PROJECT_BRAIN.md) - System overview.
2. [AI Agent Rules](./docs/ai-brain/AI_AGENT_RULES.md) - **MANDATORY READING BEFORE CODING**.
3. [System Map](./docs/ai-brain/SYSTEM_MAP.md) - Files and execution flow.
4. [API Map](./docs/ai-brain/API_MAP.md) - Endpoints.
5. [Database Map](./docs/ai-brain/DATABASE_MAP.md) - Models and relations.
6. [Workflows](./docs/ai-brain/WORKFLOWS.md) - Step-by-step logic.
7. [Security & Tenant Isolation](./docs/ai-brain/SECURITY_AND_TENANT_ISOLATION.md) - How we prevent data leaks.
8. [Financial Integrity](./docs/ai-brain/FINANCIAL_INTEGRITY.md) - ACID compliance rules.

## Core Directives for Agents
- **Never guess.** Read the brain files.
- **Never bypass Tenant IDs.**
- **Never bypass Financial Transaction wrappers.**
- **Always update this memory** if you add new APIs, tables, or major logic.
`);

console.log('Project Brain generation complete.');
