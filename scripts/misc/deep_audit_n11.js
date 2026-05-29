const { Client } = require('ssh2');

function ssh(cmd, timeout = 180000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '\n[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR] ' + err.message); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {
  const SEP = '\n' + '═'.repeat(60) + '\n';

  // ── 1. TypeScript Errors Full List ──
  process.stdout.write(SEP + '[1] FULL TYPESCRIPT ERRORS\n' + SEP);
  const tsErrors = await ssh(
    `cd ${N11} && npx tsc --noEmit 2>&1 | grep -E "error TS|\.tsx?\\(" | sed 's|/www/wwwroot/n11.namainvist.com/||g'`,
    180000
  );
  console.log(tsErrors || '✅ No TypeScript errors');

  // ── 2. Count errors by file ──
  process.stdout.write(SEP + '[2] ERROR COUNT BY FILE\n' + SEP);
  const errorCount = await ssh(
    `cd ${N11} && npx tsc --noEmit 2>&1 | grep "error TS" | sed 's|/www/wwwroot/n11.namainvist.com/||g' | grep -oP "^[^:]+\\.tsx?" | sort | uniq -c | sort -rn | head -30`,
    180000
  );
  console.log(errorCount || '✅ No errors');

  // ── 3. API Routes — all routes check ──
  process.stdout.write(SEP + '[3] ALL API ROUTES HEALTH\n' + SEP);
  const apiRoutes = await ssh(`find ${N11}/src/app/api -name "route.ts" | sed 's|${N11}/src/app/api||g' | sed 's|/route.ts||g' | sort 2>&1`);
  const routes = apiRoutes.split('\n').filter(r => r.trim());
  console.log(`Total API routes found: ${routes.length}`);
  
  // Test sample routes
  const testRoutes = [
    '/api/products', '/api/sales', '/api/purchases', '/api/customers',
    '/api/employees', '/api/dashboard', '/api/settings', '/api/auth/me',
    '/api/salaries', '/api/vacations', '/api/categories', '/api/units',
    '/api/stock', '/api/reports/sales', '/api/treasury', '/api/expenses',
    '/api/manufacturing/orders', '/api/pos/sessions', '/api/sys/health',
    '/api/accounting/accounts', '/api/smart-transfers', '/api/stock/adjustments',
    '/api/stock/movements', '/api/notifications', '/api/attendances',
    '/api/whatsapp/send', '/api/zatca/config', '/api/auth/session'
  ];
  
  for (const r of testRoutes) {
    const res = await ssh(`curl -sk -o /dev/null -w "${r} → %{http_code}" https://n11.namainvist.com${r} 2>&1`);
    console.log(res);
  }

  // ── 4. Missing Prisma Models ──
  process.stdout.write(SEP + '[4] PRISMA SCHEMA — ALL MODELS\n' + SEP);
  console.log(await ssh(`grep "^model " ${N11}/prisma/schema.prisma | sort`));

  // ── 5. Code references to non-existent Prisma models ──
  process.stdout.write(SEP + '[5] PRISMA MODEL USAGE ISSUES\n' + SEP);
  const models = ['purchaseInvoice', 'salesTarget', 'Recipe', 'Department', 'Attendance'];
  for (const m of models) {
    const count = await ssh(`grep -r "prisma\\.${m}" ${N11}/src 2>&1 | grep -v "node_modules" | wc -l`);
    const exists = await ssh(`grep -c "model ${m[0].toUpperCase() + m.slice(1)} {" ${N11}/prisma/schema.prisma 2>/dev/null || echo 0`);
    const status = parseInt(exists.trim()) > 0 ? '✅ exists' : '❌ MISSING';
    if (parseInt(count.trim()) > 0) {
      console.log(`prisma.${m}: used ${count.trim()} times → Schema: ${status}`);
    }
  }

  // ── 6. Import issues ──
  process.stdout.write(SEP + '[6] BROKEN IMPORTS SCAN\n' + SEP);
  console.log(await ssh(`grep -r "from '.*'" ${N11}/src/app/api --include="*.ts" | grep -v "node_modules" | grep -oP "from '[^']+'" | sort | uniq | grep -vE "@/|next|react|zod|jsonwebtoken|xlsx" | head -20`));

  // ── 7. Runtime errors (last 24h) ──
  process.stdout.write(SEP + '[7] RUNTIME ERRORS (last 24h)\n' + SEP);
  console.log(await ssh(`tail -100 /root/.pm2/logs/n11-error.log 2>&1 | grep -v "Could not find" | grep -E "Error:|TypeError:|at " | head -30`));

  // ── 8. Missing env vars ──
  process.stdout.write(SEP + '[8] ENV VARS CHECK\n' + SEP);
  const envVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'JWT_SECRET', 
                   'NEXT_PUBLIC_API_URL', 'CLERK_SECRET_KEY', 'TELEGRAM_BOT_TOKEN',
                   'ZATCA_API_URL', 'SMTP_HOST', 'SMS_API_KEY'];
  for (const v of envVars) {
    const val = await ssh(`grep "^${v}=" ${N11}/.env 2>/dev/null | head -1 | cut -c1-60`);
    console.log(val ? `✅ ${v}` : `❌ MISSING: ${v}`);
  }

  // ── 9. Prisma schema deep check ──
  process.stdout.write(SEP + '[9] PRISMA SCHEMA COMPLETENESS\n' + SEP);
  // Check for models referenced in API but maybe not in schema
  const apiUsage = await ssh(`grep -r "await prisma\\." ${N11}/src/app/api --include="*.ts" | grep -v "node_modules" | grep -oP "prisma\\.\\w+" | sort | uniq | sed 's/prisma\\.//g'`);
  const schemaModels = await ssh(`grep "^model " ${N11}/prisma/schema.prisma | awk '{print tolower($2)}'`);
  
  const used = apiUsage.split('\n').filter(Boolean);
  const defined = schemaModels.split('\n').filter(Boolean);
  
  const missing = used.filter(m => !defined.includes(m.toLowerCase()) && !['$transaction', '$connect', '$disconnect', '$queryRaw', '\$transaction'].includes(m));
  if (missing.length > 0) {
    console.log('❌ Used in API but NOT in Schema:');
    missing.forEach(m => console.log(`  - ${m}`));
  } else {
    console.log('✅ All Prisma models used in APIs are defined in schema');
  }

  // ── 10. Frontend pages that might be broken ──
  process.stdout.write(SEP + '[10] FRONTEND PAGES STATUS\n' + SEP);
  const pages = [
    '/dashboard', '/pos', '/sales', '/purchases', '/products', 
    '/customers', '/employees', '/settings', '/reports/sales',
    '/treasury', '/accounting', '/manufacturing', '/hr',
    '/smart-transfers', '/stock', '/whatsapp-hub', '/vacations', '/salaries',
    '/zatca', '/kiosk', '/restaurant-pos', '/b2b'
  ];
  for (const p of pages) {
    const res = await ssh(`curl -sk -o /dev/null -w "${p} → %{http_code}" https://n11.namainvist.com${p}`);
    console.log(res);
  }

  // ── 11. Build warnings ──
  process.stdout.write(SEP + '[11] BUILD WARNINGS SUMMARY\n' + SEP);
  console.log(await ssh(`cd ${N11} && npm run build 2>&1 | grep -E "^⚠|Warning:|warn" | head -20`, 300000));

  process.stdout.write('\n' + SEP + '✅ DEEP AUDIT COMPLETE\n' + SEP);
})();
