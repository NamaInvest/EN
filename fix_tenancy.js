const fs = require('fs');

const ROUTES = [
  'src/app/api/accounting/cost-centers/route.ts',
  'src/app/api/crm/leads/route.ts',
  'src/app/api/finance/assets/route.ts',
  'src/app/api/fng/budgets/route.ts',
  'src/app/api/fng/petty-cash-funds/route.ts',
  'src/app/api/purchases/requisitions/route.ts',
  'src/app/api/sales/delivery-notes/route.ts',
  'src/app/api/stock/movements/route.ts',
  'src/app/api/warehouses/route.ts',
  'src/app/api/warehouses/[id]/route.ts',
  'src/app/api/enterprise/legal/route.ts',
  'src/app/api/enterprise/mrp/route.ts',
  'src/app/api/enterprise/projects/route.ts',
  'src/app/api/enterprise/projects/tasks/route.ts',
  'src/app/api/enterprise/property/route.ts',
  'src/app/api/enterprise/quality/route.ts',
];

let fixed = 0;

ROUTES.forEach(route => {
  try {
    let c = fs.readFileSync(route, 'utf8');
    let changed = false;
    
    // Pattern 1: `import { PrismaClient } from '@prisma/client'\n...\nconst prisma = new PrismaClient();`
    if (c.includes("import { PrismaClient } from '@prisma/client'") || c.includes('import { PrismaClient } from "@prisma/client"')) {
      c = c.replace(/import\s*\{\s*PrismaClient\s*\}\s*from\s*['"]@prisma\/client['"]\s*;?\s*\r?\n/g, '');
      c = c.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\)\s*;?\s*\r?\n/g, '');
      changed = true;
    }
    
    // Pattern 2: `import { prisma } from '@/lib/prisma'`
    if (c.includes("import { prisma } from '@/lib/prisma'") || c.includes('import { prisma } from "@/lib/prisma"')) {
      c = c.replace(/import\s*\{\s*prisma\s*\}\s*from\s*['"]@\/lib\/prisma['"]\s*;?\s*\r?\n/g, '');
      changed = true;
    }
    
    if (!changed) {
      console.log('  ⊘ ' + route + ' — no matching pattern');
      return;
    }
    
    // Add getPrisma import if not present
    if (!c.includes('getPrisma')) {
      // Add after NextResponse import
      c = c.replace(
        /import\s*\{\s*NextResponse\s*\}\s*from\s*['"]next\/server['"]\s*;?/,
        "import { NextRequest, NextResponse } from 'next/server';\nimport { getPrisma } from '@/lib/prisma';"
      );
    }
    
    // Now add `const prisma = getPrisma(request|req);` inside each handler
    // Match: export async function GET/POST/PUT/PATCH/DELETE(paramName...)
    const handlerRx = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*(\w*)/g;
    let m;
    const inserts = [];
    
    while ((m = handlerRx.exec(c)) !== null) {
      let paramName = m[2] || 'request';
      // Fix: if param is empty (no type) or 'Request', it needs proper typing
      
      // Find { after the handler
      let braceStart = c.indexOf('{', m.index + m[0].length);
      if (braceStart === -1) continue;
      
      // Check if getPrisma already added inside this handler
      let nextHandler = c.indexOf('export async function', braceStart + 1);
      let fnBody = nextHandler > -1 ? c.substring(braceStart, nextHandler) : c.substring(braceStart);
      if (fnBody.includes('getPrisma')) continue;
      
      inserts.push({ idx: braceStart + 1, paramName });
    }
    
    // Insert from end to start
    inserts.reverse().forEach(ins => {
      let pName = ins.paramName;
      if (!pName || pName === 'Request' || pName === 'NextRequest') pName = 'request';
      c = c.substring(0, ins.idx) + '\n    const prisma = getPrisma(' + pName + ' as any);\n' + c.substring(ins.idx);
    });
    
    // Fix handler signatures: (request: Request) → (request: NextRequest) for getPrisma compat
    c = c.replace(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*\)/g, 
      'export async function $1(request: NextRequest)');
    c = c.replace(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*request\s*:\s*Request\s*\)/g, 
      'export async function $1(request: NextRequest)');
    c = c.replace(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*req\s*:\s*Request\s*\)/g, 
      'export async function $1(req: NextRequest)');
    
    fs.writeFileSync(route, c, 'utf8');
    console.log('  ✅ ' + route + ' — FIXED (' + inserts.length + ' handlers)');
    fixed++;
    
  } catch (e) {
    console.log('  ❌ ' + route + ' — ' + e.message);
  }
});

console.log('\n=== Fixed: ' + fixed + '/' + ROUTES.length + ' ===');
