const fs = require('fs');
const path = require('path');

const srcFilesTxt = fs.readFileSync('src_files.txt', 'utf8');
const files = srcFilesTxt.split('\n').map(f => f.trim()).filter(Boolean);

const pages = files.filter(f => f.includes('\\app\\') && (f.endsWith('page.tsx') || f.endsWith('page.jsx')));
const apis = files.filter(f => f.includes('\\api\\') && (f.endsWith('route.ts') || f.endsWith('route.js')));
const services = files.filter(f => f.includes('\\services\\') && f.endsWith('.ts'));
const controllers = files.filter(f => f.includes('\\controllers\\') && f.endsWith('.ts'));

let schemaStr = '';
try {
    schemaStr = fs.readFileSync('prisma/schema.prisma', 'utf8');
} catch (e) {
    console.log('No schema.prisma found');
}

const models = [];
const enums = [];
if (schemaStr) {
    const lines = schemaStr.split('\n');
    let currentModel = null;
    let currentEnum = null;
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('model ')) {
            currentModel = { name: line.split(' ')[1], fields: [] };
            models.push(currentModel);
        } else if (line.startsWith('enum ')) {
            currentEnum = { name: line.split(' ')[1], values: [] };
            enums.push(currentEnum);
        } else if (line.startsWith('}')) {
            currentModel = null;
            currentEnum = null;
        } else if (currentModel && line && !line.startsWith('//')) {
            currentModel.fields.push(line);
        } else if (currentEnum && line && !line.startsWith('//')) {
            currentEnum.values.push(line);
        }
    }
}

let md = `# Nama Invest ERP - System Archive\n\n`;

md += `## 1. وصف عام للنظام (General Description)\n`;
md += `Nama Invest ERP is a comprehensive, multi-tenant Enterprise Resource Planning (ERP) and Point of Sale (POS) system. It integrates Financial Accounting, Sales, Purchases, Inventory, HR & Payroll, Assets, Fleet, and more. It features atomic transactions for financial integrity, ZATCA Phase 1 & 2 integration, multi-subdomain tenancy, and a unified API for both Web and Desktop (Electron/Qt) clients.\n\n`;

md += `## 2. التقنيات المستخدمة (Tech Stack)\n`;
md += `- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui\n`;
md += `- **Backend:** Next.js API Routes (Serverless/Edge), Node.js\n`;
md += `- **Database:** PostgreSQL with Prisma ORM\n`;
md += `- **Authentication:** Clerk (Multi-tenant SSO, JWT), custom API Key & Session Middleware\n`;
md += `- **Desktop/Offline:** Electron & Qt6 (for local POS and hardware integration)\n`;
md += `- **Localization:** React i18n, next-intl\n\n`;

md += `## 3. هيكل المجلدات (Directory Structure)\n`;
md += `\`\`\`text\n`;
md += `src/\n`;
md += ` ├── app/\n`;
md += ` │   ├── (dashboard)/   # Main ERP modules UI\n`;
md += ` │   ├── api/           # Backend API Endpoints\n`;
md += ` ├── lib/\n`;
md += ` │   ├── services/      # Business Logic (Inventory, Accounting, etc.)\n`;
md += ` │   ├── prisma/        # Database setup\n`;
md += ` │   ├── utils/         # Helper functions\n`;
md += ` ├── middleware.ts      # Authentication & Routing guard\n`;
md += `prisma/\n`;
md += ` ├── schema.prisma      # DB Schema\n`;
md += `\`\`\`\n\n`;

md += `## 4. كل الصفحات والمسارات (Pages & UI Routes)\n`;
pages.forEach(p => {
    md += `- \`/${p.replace(/\\/g, '/').replace('src/app/(dashboard)/', '').replace('src/app/', '').replace('/page.tsx', '').replace('/page.jsx', '')}\`\n`;
});
md += `\n`;

md += `## 5. كل الـ API Endpoints\n`;
apis.forEach(a => {
    md += `- \`/${a.replace(/\\/g, '/').replace('src/app/api/', 'api/').replace('/route.ts', '').replace('/route.js', '')}\`\n`;
});
md += `\n`;

md += `## 6 & 7. كل الجداول والحقول والموديلات (Models, Fields, Relations)\n`;
models.forEach(m => {
    md += `### Model: ${m.name}\n`;
    md += `\`\`\`prisma\n`;
    m.fields.forEach(f => md += `  ${f}\n`);
    md += `\`\`\`\n\n`;
});

md += `## 8. كل الكنترولرز Controllers\n`;
md += `*In Next.js App Router, the API route handlers (\`route.ts\`) act as controllers. See Section 5 for the exhaustive list.*\n\n`;

md += `## 9. كل الخدمات Services\n`;
services.forEach(s => {
    md += `- \`${s.replace(/\\/g, '/')}\`\n`;
});
if (services.length === 0) {
    md += `*(Business logic is largely centralized in \`src/lib/services\` such as \`accounting-engine.service.ts\`, \`inventory.service.ts\`, \`zatca.service.ts\`, etc.)*\n`;
}
md += `\n`;

md += `## 10. كل الميدلوير Middleware\n`;
md += `### \`src/middleware.ts\` (or \`middleware.ts\`)\n`;
md += `Handles the following pipeline:\n`;
md += `1. **Subdomain Tenant Resolution:** Parses \`host\` header to identify tenant subdomain.\n`;
md += `2. **API Versioning:** Rewrites \`/api/v1/*\` to \`/api/*\`.\n`;
md += `3. **ICE Admin Panel Guard:** Checks \`ice_session\` cookie against JWT.\n`;
md += `4. **Cron Routes:** Secures \`/api/cron/*\` with \`x-cron-secret\`.\n`;
md += `5. **Public Routes:** Allows bypass for login, webhooks, Zatca callbacks, and health checks.\n`;
md += `6. **API Key Auth:** Validates Bearer \`nma_*\` format.\n`;
md += `7. **JWT Auth:** Validates Clerk/local JWT, sets headers like \`x-user-id\`, \`x-tenant-id\`, and \`x-user-role\`.\n\n`;

md += `## 11. كل الصلاحيات Roles & Permissions\n`;
md += `The system implements a granular Permission Override pattern. \n`;
md += `- **Roles:** Master Admin, Tenant Owner, Manager, Accountant, Cashier, Sales Rep, Employee, etc.\n`;
md += `- **Permissions Logic:** Enforced globally. Specific permissions dictate API execution rights and dynamic sidebar/UI rendering based on user profile and tenant subscription.\n\n`;

md += `## 12. كل الأقسام Modules\n`;
md += `The ERP is highly modular, featuring:\n`;
md += `- **Accounting & Finance:** GL, AR, AP, Treasury, Bank Recon, Assets, Costing (COPA).\n`;
md += `- **Sales & POS:** Web Sales, Offline POS, B2B, Restaurants.\n`;
md += `- **Purchases & Inventory:** Procure-to-Pay, WMS, ABC Analysis, Returns.\n`;
md += `- **HR & Payroll:** Saudi WPS, GOSI, Attendance, Leave Management.\n`;
md += `- **Manufacturing:** BOM, MRP, Shopfloor.\n`;
md += `- **CRM & Marketing:** Leads, Opportunities, Campaigns.\n`;
md += `- **Specialized Verticals:** Clinics, Schools, Real Estate, Construction, Fleet.\n\n`;

md += `## 13. منطق الاشتراكات والتراخيص (Subscriptions & Licenses)\n`;
md += `Managed via the **ICE Master Panel** (\`/api/master-panel\`). Tenants are bound to \`TenantAccount\` records which define:\n`;
md += `- Subscription Tier & Modules enabled.\n`;
md += `- License Expiry and Seat Limits.\n`;
md += `- Trial Management.\n`;
md += `The system uses middleware and global guards to enforce module access based on active subscriptions.\n\n`;

md += `## 14. منطق الشركات والـ Subdomains (Tenants)\n`;
md += `**Strict Multi-Tenancy:**\n`;
md += `- Data is logically separated in the DB using a mandatory \`tenantId\` field on almost all operational models.\n`;
md += `- The \`middleware.ts\` intercepts the \`Host\` header to inject \`x-tenant-subdomain\`.\n`;
md += `- All database queries (read/write) are wrapped in tenant-specific WHERE clauses to prevent cross-tenant data leakage.\n\n`;

md += `## 15. منطق تطبيق EXE إن وجد (Electron Desktop Logic)\n`;
md += `The desktop version utilizes **Electron** (and historically Qt) for deep OS integration:\n`;
md += `- Overrides Next.js output to \`.next-electron\`.\n`;
md += `- Handles offline POS persistence.\n`;
md += `- Interfaces with local hardware (thermal printers, barcode scanners, Mada terminals).\n`;
md += `- Interacts with ZATCA Java SDK for offline invoice signing.\n`;

fs.writeFileSync('project-docs/PROJECT_ARCHIVE.md', md, 'utf8');
console.log('PROJECT_ARCHIVE.md generated successfully.');
