const fs = require('fs');

// Critical POST/PUT routes that modify financial/sensitive data
const ROUTES = [
  'src/app/api/accounting/journal/route.ts',
  'src/app/api/banks/[id]/transactions/route.ts',
  'src/app/api/banks/route.ts',
  'src/app/api/employees/route.ts',
  'src/app/api/fixed-assets/route.ts',
  'src/app/api/fixed-assets/[id]/depreciate/route.ts',
  'src/app/api/installments/route.ts',
  'src/app/api/purchase-returns/route.ts',
  'src/app/api/salaries/route.ts',
  'src/app/api/stock-transfers/route.ts',
  'src/app/api/stock/adjustments/route.ts',
  'src/app/api/settings/[key]/route.ts',
];

const AUTH_GUARD_POST = `
    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
`;

let fixed = 0;

ROUTES.forEach(function(route) {
  try {
    let c = fs.readFileSync(route, 'utf8');
    
    if (c.includes('_getAuth') || (c.includes('getUserFromRequest') && c.includes('auth.userId'))) {
      console.log('  ✓ ' + route + ' — already secured');
      return;
    }
    
    // Find POST handler
    const postMatch = c.match(/export\s+async\s+function\s+POST\s*\([^)]*\)\s*\{/);
    if (postMatch) {
      const insertIdx = postMatch.index + postMatch[0].length;
      // Check if already has auth in POST
      const nextExport = c.indexOf('export async function', insertIdx);
      const body = nextExport > -1 ? c.substring(insertIdx, nextExport) : c.substring(insertIdx);
      if (!body.includes('getUserFromRequest') && !body.includes('_getAuth')) {
        c = c.substring(0, insertIdx) + AUTH_GUARD_POST + c.substring(insertIdx);
      }
    }
    
    // Find PUT handler
    const putMatch = c.match(/export\s+async\s+function\s+PUT\s*\([^)]*\)\s*\{/);
    if (putMatch) {
      const insertIdx = putMatch.index + putMatch[0].length;
      const nextExport = c.indexOf('export async function', insertIdx);
      const body = nextExport > -1 ? c.substring(insertIdx, nextExport) : c.substring(insertIdx);
      if (!body.includes('getUserFromRequest') && !body.includes('_getAuth')) {
        c = c.substring(0, insertIdx) + AUTH_GUARD_POST + c.substring(insertIdx);
      }
    }
    
    fs.writeFileSync(route, c, 'utf8');
    console.log('  ✅ ' + route);
    fixed++;
  } catch (e) {
    console.log('  ❌ ' + route + ' — ' + e.message);
  }
});

console.log('\n=== Fixed: ' + fixed + '/' + ROUTES.length + ' ===');
