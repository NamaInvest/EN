const fs = require('fs');

// Only fix tenant-data routes, NOT admin/master/tenant management routes
const ROUTES = [
  'src/app/api/branches/route.ts',
  'src/app/api/purchases/grn/route.ts',
  'src/app/api/purchases/rfq/route.ts',
  'src/app/api/shifts/route.ts',
  'src/app/api/stock/adjustments/route.ts',
  'src/app/api/enterprise/wms/route.ts',
];

// Skip intentionally: admin/*, ai/*, auth/sync, master-panel-data, subscription*, tenant/*

let fixed = 0;

ROUTES.forEach(function(route) {
  try {
    let c = fs.readFileSync(route, 'utf8');
    
    if (!c.includes('new PrismaClient()')) {
      console.log('  ✓ ' + route + ' — already clean');
      return;
    }
    
    // Remove PrismaClient import and instance
    c = c.replace(/import\s*\{\s*PrismaClient\s*\}\s*from\s*['"]@prisma\/client['"]\s*;?\s*\r?\n/g, '');
    c = c.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\)\s*;?\s*\r?\n/g, '');
    
    // Add getPrisma import if missing
    if (!c.includes('getPrisma')) {
      c = c.replace(
        /import\s*\{\s*(NextRequest,\s*)?NextResponse\s*\}\s*from\s*['"]next\/server['"]\s*;?/,
        "import { NextRequest, NextResponse } from 'next/server';\nimport { getPrisma } from '@/lib/prisma';"
      );
    }
    
    // Add `const prisma = getPrisma(request|req);` inside each handler
    const handlerRx = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*(\w*)/g;
    let m;
    const inserts = [];
    
    while ((m = handlerRx.exec(c)) !== null) {
      let paramName = m[2] || 'request';
      let braceStart = c.indexOf('{', m.index + m[0].length);
      if (braceStart === -1) continue;
      
      let nextHandler = c.indexOf('export async function', braceStart + 1);
      let fnBody = nextHandler > -1 ? c.substring(braceStart, nextHandler) : c.substring(braceStart);
      if (fnBody.includes('getPrisma')) continue;
      
      inserts.push({ idx: braceStart + 1, paramName });
    }
    
    inserts.reverse().forEach(function(ins) {
      var pName = ins.paramName;
      if (!pName || pName === 'Request' || pName === 'NextRequest') pName = 'request';
      c = c.substring(0, ins.idx) + '\n    const prisma = getPrisma(' + pName + ' as any);\n' + c.substring(ins.idx);
    });
    
    // Fix handler signatures
    c = c.replace(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*\)/g, 
      'export async function $1(request: NextRequest)');
    c = c.replace(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*request\s*:\s*Request\s*\)/g, 
      'export async function $1(request: NextRequest)');
    
    fs.writeFileSync(route, c, 'utf8');
    console.log('  ✅ ' + route + ' — FIXED');
    fixed++;
  } catch (e) {
    console.log('  ❌ ' + route + ' — ' + e.message);
  }
});

console.log('\n=== Fixed: ' + fixed + '/' + ROUTES.length + ' ===');
