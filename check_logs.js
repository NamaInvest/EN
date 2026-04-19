const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/app/api/**/route.ts');

let issues = [];

files.forEach(function(f) {
    const c = fs.readFileSync(f, 'utf8');
    
    // 1. Check for new PrismaClient() — should use getPrisma
    if (c.includes('new PrismaClient()')) {
        issues.push({ file: f, issue: 'STILL using new PrismaClient()', severity: 'CRITICAL' });
    }
    
    // 2. Check for broken function signatures (from auto-fix)
    if (c.includes('getPrisma(request as any);\n params }')) {
        issues.push({ file: f, issue: 'BROKEN function signature from auto-fix', severity: 'CRITICAL' });
    }
    
    // 3. Check for exposed secrets/passwords in code
    if (c.includes('password') && !f.includes('auth') && !f.includes('login') && !f.includes('user') && !f.includes('b2b')) {
        // Only flag if it contains hardcoded password string
        const passwordMatch = c.match(/password\s*[:=]\s*['"][^'"]+['"]/);
        if (passwordMatch && !passwordMatch[0].includes('passwordHash') && !passwordMatch[0].includes('body.password')) {
            issues.push({ file: f, issue: 'Possible hardcoded password: ' + passwordMatch[0].substring(0, 30), severity: 'HIGH' });
        }
    }
    
    // 4. Check for unprotected deleteMany (bulk delete)
    if (c.includes('deleteMany(') && !c.includes('getUserFromRequest') && !c.includes('_getAuth') && !c.includes('_auth')) {
        if (!f.includes('system/reset') && !f.includes('cron') && !f.includes('tenant')) {
            issues.push({ file: f, issue: 'deleteMany without auth check', severity: 'HIGH' });
        }
    }
    
    // 5. Check for SQL injection (raw queries)
    if (c.includes('$queryRaw') || c.includes('$executeRaw')) {
        if (!c.includes('Prisma.sql') && !c.includes('Prisma.join')) {
            issues.push({ file: f, issue: 'Raw SQL query — possible injection', severity: 'MEDIUM' });
        }
    }
    
    // 6. Check for unrestricted findMany without where (performance)
    const findManyNoWhere = c.match(/\.findMany\(\s*\)/g);
    if (findManyNoWhere && findManyNoWhere.length > 0) {
        // Only flag if it's a large table
        if (f.includes('sales') || f.includes('purchase') || f.includes('stock') || f.includes('journal')) {
            issues.push({ file: f, issue: 'findMany() without where on large table', severity: 'MEDIUM' });
        }
    }
    
    // 7. Verify financial routes have round2
    const isFinancial = f.includes('sales/route') || f.includes('purchases/route') || f.includes('pos/checkout') || f.includes('expenses/route') || f.includes('treasury/route');
    if (isFinancial && !c.includes('round2')) {
        issues.push({ file: f, issue: 'Financial route missing round2', severity: 'MEDIUM' });
    }
});

console.log('=== VERIFICATION SCAN RESULTS ===');
console.log('Files scanned:', files.length);
console.log('Issues found:', issues.length);
console.log('');

if (issues.length === 0) {
    console.log('✅ NO ISSUES FOUND — System is clean!');
} else {
    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');
    
    if (critical.length) {
        console.log('🔴 CRITICAL (' + critical.length + '):');
        critical.forEach(i => console.log('  ' + i.file + ' — ' + i.issue));
    }
    if (high.length) {
        console.log('🟠 HIGH (' + high.length + '):');
        high.forEach(i => console.log('  ' + i.file + ' — ' + i.issue));
    }
    if (medium.length) {
        console.log('🟡 MEDIUM (' + medium.length + '):');
        medium.forEach(i => console.log('  ' + i.file + ' — ' + i.issue));
    }
}
