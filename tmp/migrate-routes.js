const fs = require('fs');
const path = require('path');

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Add withRoute import if missing
  if (!content.includes('withRoute')) {
    content = content.replace(/(import.*from.*(?:'next\/server'|"next\/server");?)/, "$1\nimport { withRoute } from '@/lib/api/with-route';");
  }

  // Replace function declarations with withRoute
  // Handles export async function GET(request: Request) or (req: NextRequest)
  content = content.replace(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*([^)]*?)\s*\)\s*\{/g, 
    "export const $1 = withRoute(async ({ req, prisma, auth, tenant }) => {");

  // Fix ending brackets for functions. We assume the last } before next export or end of file is the function end.
  // Actually, a simpler way is to replace `\n}` at the end of the file or before an export.
  // But wait, there might be try/catch. Let's just do a naive replacement where we replace the outermost function blocks.
  
  // A safe regex for closing brackets of exported functions
  // We can look for `^}` at the start of a line that is followed by either an empty line, EOF, or another export.
  content = content.replace(/^}(\s*)$/gm, "}, { rateLimit: 'DEFAULT', tenantRequired: true });$1");

  // Replace tenantId extractions
  content = content.replace(/const\s+tenantId\s*=\s*searchParams\.get\('tenantId'\)\s*(?:\|\||\?\?)\s*['"]default['"];?\s*(?:\/\/.*)?/g, "");
  content = content.replace(/const\s+tenantId\s*=\s*searchParams\.get\('tenantId'\)\s*(?:\|\||\?\?)\s*['"]1['"];?\s*(?:\/\/.*)?/g, "");
  content = content.replace(/const\s+tenantId\s*=\s*body\.tenantId;/g, "");
  
  // Replace references to body.tenantId or query tenantId with just tenant
  content = content.replace(/body\.tenantId/g, "tenant");
  content = content.replace(/searchParams\.get\('tenantId'\)/g, "tenant");
  // If the variable tenantId was used directly
  content = content.replace(/tenantId/g, "tenant");

  // Ensure request references are mapped to req
  // if the original param was `request`, and now we have `req`
  content = content.replace(/const\s+\{\s*searchParams\s*\}\s*=\s*new\s*URL\s*\(\s*request\.url\s*\)/g, "const { searchParams } = new URL(req.url)");
  content = content.replace(/await\s+request\.json\(\)/g, "await req.json()");
  content = content.replace(/request\.headers/g, "req.headers");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Migrated: ${filePath}`);
    return true;
  }
  return false;
}

const files = [
  'src/app/api/finance/aging/route.ts',
  'src/app/api/finance/aro/route.ts',
  'src/app/api/finance/asset-lifecycle/route.ts',
  'src/app/api/finance/bad-debt/route.ts',
  'src/app/api/finance/cashflow/route.ts',
  'src/app/api/finance/contract-assets/route.ts',
  'src/app/api/finance/copa/route.ts',
  'src/app/api/finance/deferred-tax/route.ts',
  'src/app/api/finance/equity-statement/route.ts',
  'src/app/api/finance/fs-notes/route.ts',
  'src/app/api/finance/impairment/route.ts',
  'src/app/api/finance/multi-gaap/route.ts',
  'src/app/api/finance/segments/route.ts',
  'src/app/api/finance/transfer-pricing/route.ts',
  'src/app/api/hr/attendance/punch/route.ts',
  'src/app/api/hr/comp-review/route.ts',
  'src/app/api/hr/competency/route.ts',
  'src/app/api/hr/ess/route.ts',
  'src/app/api/hr/lms/route.ts',
  'src/app/api/hr/okrs/route.ts',
  'src/app/api/hr/payroll/multi-country/route.ts',
  'src/app/api/hr/recruitment/route.ts',
  'src/app/api/hr/safety/route.ts',
  'src/app/api/hr/succession/route.ts',
  'src/app/api/manufacturing/aps/route.ts',
  'src/app/api/manufacturing/bom/route.ts',
  'src/app/api/manufacturing/eco/route.ts',
  'src/app/api/manufacturing/mes/route.ts',
  'src/app/api/manufacturing/mes-oee/route.ts',
  'src/app/api/manufacturing/oee/route.ts',
  'src/app/api/manufacturing/sop/route.ts',
  'src/app/api/manufacturing/spc/route.ts',
  'src/app/api/warehouse/cross-dock/route.ts',
  'src/app/api/warehouse/slotting/route.ts',
  'src/app/api/copa/allocations/route.ts',
  'src/app/api/copa/route.ts'
];

let count = 0;
for (const f of files) {
  if (fs.existsSync(f)) {
    if (migrateFile(f)) count++;
  }
}
console.log(`Migrated ${count} files.`);
