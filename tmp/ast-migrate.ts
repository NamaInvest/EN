import { Project, SyntaxKind, VariableDeclarationKind } from 'ts-morph';
import * as fs from 'fs';

const project = new Project();
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

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  const sourceFile = project.addSourceFileAtPath(filePath);

  let modified = false;

  const imports = sourceFile.getImportDeclarations();
  const hasWithRoute = imports.some(i => i.getModuleSpecifierValue() === '@/lib/api/with-route');
  if (!hasWithRoute) {
    sourceFile.addImportDeclaration({
      namedImports: ['withRoute'],
      moduleSpecifier: '@/lib/api/with-route',
    });
    modified = true;
  }

  const authImport = imports.find(i => i.getModuleSpecifierValue() === '@/lib/auth');
  if (authImport) {
    const namedImports = authImport.getNamedImports();
    const getUserImport = namedImports.find(n => n.getName() === 'getUserFromRequest');
    if (getUserImport) {
      if (namedImports.length === 1) {
        authImport.remove();
      } else {
        getUserImport.remove();
      }
      modified = true;
    }
  }

  const functions = sourceFile.getFunctions();
  
  for (const func of functions) {
    if (!func.isExported()) continue;
    const name = func.getName();
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(name || '')) continue;

    const bodyText = func.getBodyText() || '';
    let newBody = bodyText;

    // Convert all `request` to `req`
    newBody = newBody.replace(/\brequest\b/g, "req");

    // Convert auth logic
    newBody = newBody.replace(/getUserFromRequest\(req as any\)/g, "auth");
    
    // Hardcoded tenants
    newBody = newBody.replace(/const\s+tenantId\s*=\s*searchParams\.get\('tenantId'\)\s*(?:\|\||\?\?)\s*['"][^'"]+['"];?/g, "");
    newBody = newBody.replace(/const\s+tenantId\s*=\s*body\.tenantId;/g, "");
    
    // Destructuring fixes: `const { tenantId, other } = body` -> `const { other } = body`
    // Safest way is regex:
    newBody = newBody.replace(/\{\s*tenantId\s*,\s*/g, "{ ");
    newBody = newBody.replace(/,\s*tenantId\s*\}/g, " }");
    newBody = newBody.replace(/\{\s*tenantId\s*\}/g, "{ }");
    newBody = newBody.replace(/const\s+\{\s*\}\s*=\s*(body|req\.json\(\)|searchParams);?/g, "");

    // Parameter extraction fixes: `const tenantId = searchParams.get('tenantId');`
    newBody = newBody.replace(/const\s+tenantId\s*=\s*searchParams\.get\('tenantId'\);?/g, "");

    // Now replace usages of tenantId and body.tenantId with just `tenant`
    newBody = newBody.replace(/body\.tenantId/g, "tenant");
    newBody = newBody.replace(/searchParams\.get\('tenantId'\)/g, "tenant");
    newBody = newBody.replace(/\btenantId\b/g, "tenant");

    // Prevent duplicate prisma
    newBody = newBody.replace(/const\s+prisma\s*=\s*(?:await\s+)?getPrisma\(tenant\);?/g, "");
    newBody = newBody.replace(/const\s+prisma\s*=\s*(?:await\s+)?getPrisma\(req\);?/g, "");

    sourceFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: name!,
        initializer: `withRoute(async ({ req, prisma, auth, tenant }) => {\n${newBody}\n}, { rateLimit: 'DEFAULT', tenantRequired: true })`
      }]
    });

    func.remove();
    modified = true;
  }

  if (modified) {
    sourceFile.saveSync();
    console.log(`Migrated: ${filePath}`);
    count++;
  }
}

console.log(`Successfully migrated ${count} files.`);
