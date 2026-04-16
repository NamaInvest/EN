const { Client } = require('ssh2');

function ssh(cmd, timeout = 60000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '\n[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR] ' + err.message); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {
  const SEP = '\n' + '═'.repeat(55) + '\n';

  // ── 1. PM2 Status ──
  process.stdout.write(SEP + '[1] PM2 STATUS\n' + SEP);
  console.log(await ssh(`pm2 describe n11 2>&1 | grep -E "status|restart|uptime|mem|pid"`));
  console.log(await ssh(`pm2 list 2>&1 | grep n11`));

  // ── 2. HTTP Endpoints ──
  process.stdout.write(SEP + '[2] HTTP ENDPOINT TESTS\n' + SEP);
  const routes = ['/', '/login', '/dashboard', '/pos', '/sales', '/purchases', '/products', '/api/auth/me', '/api/dashboard'];
  for (const r of routes) {
    const res = await ssh(`curl -sk -o /dev/null -w "${r} → %{http_code}" https://n11.namainvist.com${r} 2>&1`);
    console.log(res);
  }

  // ── 3. TypeScript / Build Errors ──
  process.stdout.write(SEP + '[3] TYPESCRIPT ISSUES (tsc --noEmit)\n' + SEP);
  console.log(await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | head -80`, 120000));

  // ── 4. Runtime Errors (pm2 logs) ──
  process.stdout.write(SEP + '[4] RUNTIME ERRORS (pm2 log last 60)\n' + SEP);
  console.log(await ssh(`tail -60 /root/.pm2/logs/n11-error.log 2>&1`));

  // ── 5. Nginx errors ──
  process.stdout.write(SEP + '[5] NGINX ERRORS (last 20)\n' + SEP);
  console.log(await ssh(`tail -20 /www/wwwlogs/n11.namainvist.com.error.log 2>&1`));

  // ── 6. Database Connection ──
  process.stdout.write(SEP + '[6] DATABASE CONNECTION\n' + SEP);
  console.log(await ssh(`cd ${N11} && node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\\$connect().then(()=>{console.log('DB ✅ Connected');p.\\$disconnect();}).catch(e=>console.error('DB ❌',e.message));" 2>&1`, 30000));

  // ── 7. .env Variables ──
  process.stdout.write(SEP + '[7] ENVIRONMENT VARIABLES (.env)\n' + SEP);
  console.log(await ssh(`cat ${N11}/.env 2>&1`));

  // ── 8. Missing / Broken API Routes ──
  process.stdout.write(SEP + '[8] API ROUTES HEALTH SCAN\n' + SEP);
  const apiTests = [
    '/api/products', '/api/sales', '/api/purchases', '/api/customers',
    '/api/employees', '/api/dashboard', '/api/settings', '/api/auth/me',
    '/api/sys/health'
  ];
  for (const api of apiTests) {
    const res = await ssh(`curl -sk -o /dev/null -w "${api} → %{http_code}" https://n11.namainvist.com${api} 2>&1`);
    console.log(res);
  }

  // ── 9. Prisma Schema vs DB ──
  process.stdout.write(SEP + '[9] PRISMA SCHEMA STATUS\n' + SEP);
  console.log(await ssh(`cd ${N11} && npx prisma db pull --print 2>&1 | grep -E "model |@@map|error|Error" | head -30`, 60000));

  // ── 10. Disk & Memory ──
  process.stdout.write(SEP + '[10] SYSTEM RESOURCES\n' + SEP);
  console.log(await ssh(`df -h / && free -h && du -sh ${N11}/`));

  // ── 11. Node Version ──
  process.stdout.write(SEP + '[11] NODE / NPM / NEXT VERSIONS\n' + SEP);
  console.log(await ssh(`node -v && npm -v && cd ${N11} && npx next --version 2>&1`));

  // ── 12. Missing Files / Broken Imports ──
  process.stdout.write(SEP + '[12] MISSING MODULES CHECK\n' + SEP);
  console.log(await ssh(`cd ${N11} && node -e "require('./src/lib/prisma')" 2>&1 | head -5`));
  console.log(await ssh(`cd ${N11} && ls src/lib/ 2>&1`));

  // ── 13. Security Scan ──
  process.stdout.write(SEP + '[13] SECURITY SCAN (.env permissions)\n' + SEP);
  console.log(await ssh(`stat -c "%a %n" ${N11}/.env 2>&1`));
  console.log(await ssh(`ls -la ${N11}/ | grep -E "\.env|key|secret|\.cert|\.pem" 2>&1`));

  // ── 14. Installed packages vs package.json ──
  process.stdout.write(SEP + '[14] PACKAGE INTEGRITY\n' + SEP);
  console.log(await ssh(`cd ${N11} && npm ls --depth=0 2>&1 | grep -E "missing|MISSING|invalid|INVALID|error" | head -20`));

  // ── 15. ZATCA CSR / Settings ──
  process.stdout.write(SEP + '[15] ZATCA & KEY SETTINGS\n' + SEP);
  console.log(await ssh(`cd ${N11} && node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.setting.findMany({where:{key:{in:['company_name','vat_number','cr_number','zatca_csr','zatca_onboarded']}}}).then(s=>{
  s.forEach(r=>console.log(r.key+':', r.value ? r.value.substring(0,40)+'...' : 'NULL'));
  p.\\$disconnect();
}).catch(e=>console.error('❌',e.message));
" 2>&1`, 30000));

  process.stdout.write('\n' + SEP + '✅ AUDIT COMPLETE\n' + SEP);
})();
