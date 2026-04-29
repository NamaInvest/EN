const fs = require('fs');

// Add round2 import and wrap financial calculations
const FINANCIAL_ROUTES = [
  'src/app/api/sales/route.ts',
  'src/app/api/purchases/route.ts',
  'src/app/api/expenses/route.ts',
  'src/app/api/treasury/route.ts',
  'src/app/api/salaries/route.ts',
  'src/app/api/sales-returns/route.ts',
  'src/app/api/purchase-returns/route.ts',
];

let fixed = 0;

FINANCIAL_ROUTES.forEach(route => {
  try {
    let c = fs.readFileSync(route, 'utf8');
    
    if (c.includes('round2')) {
      console.log('  ✓ ' + route + ' — already has round2');
      return;
    }
    
    // Add round2 import
    if (c.includes("import { getPrisma }")) {
      c = c.replace(
        "import { getPrisma } from '@/lib/prisma';",
        "import { getPrisma } from '@/lib/prisma';\nimport { round2 } from '@/lib/money';"
      );
    } else if (c.includes("from '@/lib/prisma'")) {
      // Add after any prisma import
      c = c.replace(
        /from\s*'@\/lib\/prisma'\s*;/,
        "from '@/lib/prisma';\nimport { round2 } from '@/lib/money';"
      );
    }
    
    // Wrap common financial calculations with round2
    // Pattern: subtotal + taxValue, total + tax, etc.
    // We target the most common patterns found in the codebase:
    
    // 1. `total: subtotal + taxValue - discountValue`
    c = c.replace(/total:\s*([\w.]+)\s*\+\s*([\w.]+)\s*-\s*([\w.]+)/g, function(m, a, b, d) {
      if (m.includes('round2')) return m;
      return 'total: round2(' + a + ' + ' + b + ' - ' + d + ')';
    });
    
    // 2. `remaining: total - paid`
    c = c.replace(/remaining:\s*([\w.]+)\s*-\s*([\w.]+)/g, function(m, a, b) {
      if (m.includes('round2')) return m;
      return 'remaining: round2(' + a + ' - ' + b + ')';
    });
    
    // 3. `taxValue: subtotal * (taxRate / 100)` pattern
    c = c.replace(/taxValue:\s*([\w.]+)\s*\*\s*\(([\w.]+)\s*\/\s*100\)/g, function(m, a, b) {
      if (m.includes('round2')) return m;
      return 'taxValue: round2(' + a + ' * (' + b + ' / 100))'; 
    });
    
    // 4. `netSalary: ... - deductions`
    c = c.replace(/netSalary:\s*([\w.]+(?:\s*[+\-]\s*[\w.]+)*)/g, function(m, expr) {
      if (m.includes('round2')) return m;
      return 'netSalary: round2(' + expr + ')';
    });
    
    fs.writeFileSync(route, c, 'utf8');
    console.log('  ✅ ' + route + ' — round2 added');
    fixed++;
  } catch (e) {
    console.log('  ❌ ' + route + ' — ' + e.message);
  }
});

console.log('\n=== Fixed: ' + fixed + '/' + FINANCIAL_ROUTES.length + ' ===');
