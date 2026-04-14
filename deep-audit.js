const { Client } = require('ssh2');
const https = require('https');
const fs = require('fs');

const SERVER = '46.4.188.170';

function ssh(cmd, timeout = 20000) {
  return new Promise((res, rej) => {
    const timer = setTimeout(() => res('SSH_TIMEOUT'), timeout);
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { clearTimeout(timer); c.end(); res(out.trim()); });
      });
    }).on('error', () => { clearTimeout(timer); res('SSH_ERR'); })
      .connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function httpCheck(url, timeout = 6000) {
  return new Promise(r => {
    const req = https.get(url, { timeout, headers: { 'User-Agent': 'audit/2.0' } }, res => {
      let body = '';
      res.on('data', d => { if (body.length < 3000) body += d; });
      res.on('end', () => r({
        status: res.statusCode,
        redirect: res.headers?.location || null,
        cacheControl: res.headers?.['cache-control'] || '-',
        cfCache: res.headers?.['cf-cache-status'] || '-',
        nextCache: res.headers?.['x-nextjs-cache'] || '-',
        ssl: res.socket?.getPeerCertificate?.()?.valid_to || 'N/A',
        body: body
      }));
    });
    req.on('error', e => r({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); r({ status: 0, error: 'TIMEOUT' }); });
  });
}

async function deepAudit(node) {
  const { name, path, pm2, url, port } = node;
  const issues = [];
  const checks = {};

  // ─────────────────────────────────────────────────────────────
  // BLOCK A — Infrastructure
  // ─────────────────────────────────────────────────────────────

  // A1. PM2 status + ecosystem
  const pm2Info = await ssh(`pm2 jlist 2>/dev/null | python3 -c "
import json,sys
data=json.load(sys.stdin)
for p in data:
  if p['name']=='${pm2}':
    status=p['pm2_env']['status']
    restarts=p['pm2_env'].get('restart_time',0)
    mem=p['monit'].get('memory',0)//1024//1024
    cpu=p['monit'].get('cpu',0)
    uptime=p['pm2_env'].get('pm_uptime',0)
    print(f'{status}|{restarts}|{mem}|{cpu}|{uptime}')
    break
else:
  print('NOT_FOUND|-|-|-|-')
" 2>/dev/null || echo "PY_ERR|-|-|-|-"`);
  const [pm2Status, pm2Restarts, pm2MemMB, pm2CPU, pm2Uptime] = pm2Info.split('|');
  checks.pm2Status = pm2Status?.trim() || 'NOT_FOUND';
  checks.pm2Restarts = parseInt(pm2Restarts) || 0;
  checks.pm2MemMB = parseInt(pm2MemMB) || 0;
  checks.pm2CPU = parseFloat(pm2CPU) || 0;
  
  if (checks.pm2Status !== 'online') issues.push({ sev: 'CRITICAL', msg: `PM2 "${pm2}" offline: ${checks.pm2Status}` });
  if (checks.pm2Restarts > 30) issues.push({ sev: 'WARN', msg: `High restart count: ${checks.pm2Restarts}` });
  if (checks.pm2MemMB > 700) issues.push({ sev: 'WARN', msg: `High memory: ${checks.pm2MemMB} MB` });

  // A2. Port listening
  const portListening = await ssh(`nc -z 127.0.0.1 ${port} 2>/dev/null && echo YES || echo NO`);
  checks.portListening = portListening.includes('YES');
  if (!checks.portListening) issues.push({ sev: 'CRITICAL', msg: `Port ${port} not responding` });

  // A3. Disk space on server
  const disk = await ssh(`df -h /www/wwwroot/${path.split('/').pop()} 2>/dev/null | tail -1 | awk '{print $5}'`);
  checks.diskUsed = disk.replace('%','') || '?';
  if (parseInt(checks.diskUsed) > 85) issues.push({ sev: 'CRITICAL', msg: `Disk ${checks.diskUsed}% full` });
  else if (parseInt(checks.diskUsed) > 70) issues.push({ sev: 'WARN', msg: `Disk ${checks.diskUsed}% used` });

  // A4. Node.js version
  const nodeVer = await ssh(`node -v 2>/dev/null | head -1`);
  checks.nodeVersion = nodeVer || 'unknown';

  // ─────────────────────────────────────────────────────────────
  // BLOCK B — Environment & Config
  // ─────────────────────────────────────────────────────────────

  // B1. .env file exists + critical keys
  const envCheck = await ssh(`
    ENV="${path}/.env"
    [ -f "$ENV" ] || ENV="${path}/.env.local"
    [ -f "$ENV" ] || ENV="${path}/.env.production"
    if [ -f "$ENV" ]; then
      CLERK=$(grep -c "CLERK_SECRET_KEY\\|NEXT_PUBLIC_CLERK" "$ENV" 2>/dev/null || echo 0)
      DB=$(grep -c "DATABASE_URL\\|MONGODB_URI\\|DB_URL\\|NEXT_PUBLIC_SUPABASE" "$ENV" 2>/dev/null || echo 0)
      echo "FOUND|CLERK=$CLERK|DB=$DB|$(wc -l < $ENV)"
    else
      echo "MISSING|CLERK=0|DB=0|0"
    fi
  `);
  const envParts = envCheck.split('|');
  checks.envExists = envParts[0] === 'FOUND';
  checks.envClerkKeys = parseInt((envParts[1] || '').replace('CLERK=', '')) > 0;
  checks.envDbKeys = parseInt((envParts[2] || '').replace('DB=', '')) > 0;
  checks.envLines = parseInt(envParts[3]) || 0;
  
  if (!checks.envExists) issues.push({ sev: 'CRITICAL', msg: '.env file missing' });
  else {
    if (!checks.envClerkKeys) issues.push({ sev: 'CRITICAL', msg: 'CLERK_SECRET_KEY missing from .env' });
    if (!checks.envDbKeys) issues.push({ sev: 'WARN', msg: 'No DB connection string in .env' });
  }

  // B2. Middleware.ts exists and protects routes
  const mwCheck = await ssh(`
    MW="${path}/src/middleware.ts"
    [ -f "$MW" ] && echo "FOUND|$(wc -l < $MW)|$(grep -c 'sign-in\\|signIn\\|clerkMiddleware' $MW)" || echo "MISSING|0|0"
  `);
  const [mwExists, mwLines, mwHasAuth] = mwCheck.split('|');
  checks.middlewareExists = mwExists === 'FOUND';
  checks.middlewareAuthLines = parseInt(mwHasAuth) || 0;
  if (!checks.middlewareExists) issues.push({ sev: 'CRITICAL', msg: 'middleware.ts missing' });
  else if (checks.middlewareAuthLines === 0) issues.push({ sev: 'WARN', msg: 'middleware.ts may not have auth protection' });

  // ─────────────────────────────────────────────────────────────
  // BLOCK C — Build & Source
  // ─────────────────────────────────────────────────────────────

  // C1. Build ID exists
  const buildId = await ssh(`cat "${path}/.next/BUILD_ID" 2>/dev/null || echo "MISSING"`);
  checks.buildId = buildId.includes('MISSING') ? 'MISSING' : buildId.substring(0, 12);
  if (buildId.includes('MISSING')) issues.push({ sev: 'CRITICAL', msg: 'No .next build' });

  // C2. Static index.html trap
  const staticHtml = await ssh(`[ -f "${path}/.next/server/app/index.html" ] && echo "BAD" || echo "OK"`);
  checks.staticHtmlTrap = staticHtml === 'BAD';
  if (staticHtml === 'BAD') issues.push({ sev: 'WARN', msg: 'Static index.html may serve stale content' });

  // C3. page.tsx type
  const pageInfo = await ssh(`wc -l < "${path}/src/app/page.tsx" 2>/dev/null; head -2 "${path}/src/app/page.tsx" 2>/dev/null`);
  const pageLines = parseInt(pageInfo.split('\n')[0]) || 0;
  const pageCode = pageInfo.split('\n').slice(1).join(' ');
  checks.pageLines = pageLines;
  checks.pageType = pageCode.includes('LandingPage') ? 'LANDING' :
                    pageCode.includes('redirect') ? 'ERP_REDIRECT' :
                    pageCode.includes('use client') && pageLines > 100 ? 'CLIENT_BLOAT' : 'OTHER';
  if (name !== 'main-site' && checks.pageType === 'CLIENT_BLOAT') {
    issues.push({ sev: 'CRITICAL', msg: `page.tsx has ${pageLines} lines — has wrong landing page code` });
  }

  // C4. Translations file integrity
  const transCheck = await ssh(`
    TRANS="${path}/src/translations.ts"
    [ -f "$TRANS" ] && {
      LINES=$(wc -l < "$TRANS")
      SYNTAX=$(node --input-type=module 2>&1 <<< "import { createRequire } from 'module'; const r = createRequire(import.meta.url); try { r('${path}/src/translations.ts'); console.log('OK'); } catch(e) { console.log('ERR:'+e.message.slice(0,50)); }" 2>/dev/null || echo "cannot_check")
      echo "FOUND|$LINES|$SYNTAX"
    } || echo "MISSING|0|N/A"
  `);
  const [transExists, transLines] = transCheck.split('|');
  checks.translationsExists = transExists === 'FOUND';
  checks.translationsLines = parseInt(transLines) || 0;
  if (!checks.translationsExists) issues.push({ sev: 'WARN', msg: 'translations.ts missing' });

  // C5. Sidebar 104 check
  const sidebarCheck = await ssh(`grep -c "104" "${path}/src/components/Sidebar.tsx" 2>/dev/null || echo "0"`);
  checks.sidebar104 = parseInt(sidebarCheck) > 0;
  if (!checks.sidebar104) issues.push({ sev: 'WARN', msg: 'Sidebar still has old 73 labels' });

  // C6. 104-modules page
  const page104 = await ssh(`[ -d "${path}/src/app/(dashboard)/reports/104-modules" ] && echo "YES" || echo "NO"`);
  checks.has104ModulePage = page104.includes('YES');
  if (!checks.has104ModulePage && name !== 'main-site') {
    issues.push({ sev: 'WARN', msg: '/reports/104-modules not found (404)' });
  }

  // ─────────────────────────────────────────────────────────────
  // BLOCK D — HTTPS & API
  // ─────────────────────────────────────────────────────────────

  // D1. HTTP response check
  const httpResp = await httpCheck(url);
  checks.httpStatus = httpResp.status;
  checks.httpRedirect = httpResp.redirect;
  checks.cfCache = httpResp.cfCache;
  checks.sslCert = httpResp.ssl;

  if (httpResp.status === 0) issues.push({ sev: 'CRITICAL', msg: `Unreachable: ${httpResp.error}` });
  else if (httpResp.status >= 500) issues.push({ sev: 'CRITICAL', msg: `HTTP ${httpResp.status} Server Error` });
  else if (httpResp.status === 404) issues.push({ sev: 'CRITICAL', msg: 'HTTP 404 Not Found' });
  else if (httpResp.status === 200 && name !== 'main-site') {
    // ERP nodes should redirect to dashboard/sign-in not serve 200 on root
    const hasSignIn = httpResp.body?.includes('/sign-in') || httpResp.body?.includes('clerk');
    if (!hasSignIn) issues.push({ sev: 'WARN', msg: 'Root returns 200 without auth redirect' });
  }

  // D2. API health endpoint
  const apiUrl = url.replace(/\/$/, '') + '/api/health';
  const apiResp = await httpCheck(apiUrl);
  checks.apiHealthStatus = apiResp.status;
  if (apiResp.status !== 200) {
    issues.push({ sev: 'WARN', msg: `/api/health returned ${apiResp.status}` });
  }

  // D3. SSL certificate expiry
  const sslCheck = await ssh(`
    echo | openssl s_client -servername ${url.replace('https://','').replace('http://','').replace('/','').replace(':443','')} -connect ${url.replace('https://','').replace('http://','').replace('/','').replace(':443','')}:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2 || echo "SSL_ERR"
  `);
  checks.sslExpiry = sslCheck || 'unknown';
  if (!sslCheck.includes('SSL_ERR') && sslCheck !== 'unknown') {
    const expDate = new Date(sslCheck);
    const daysLeft = Math.floor((expDate - Date.now()) / (1000*60*60*24));
    checks.sslDaysLeft = daysLeft;
    if (daysLeft < 7) issues.push({ sev: 'CRITICAL', msg: `SSL expires in ${daysLeft} days!` });
    else if (daysLeft < 30) issues.push({ sev: 'WARN', msg: `SSL expires in ${daysLeft} days` });
  }

  // ─────────────────────────────────────────────────────────────
  // BLOCK E — PM2 Startup & Recovery
  // ─────────────────────────────────────────────────────────────

  // E1. PM2 startup configured (survives server reboot)
  const pm2Startup = await ssh(`pm2 list 2>/dev/null | grep -c "${pm2}"' || echo "0"`);
  const pm2Saved = await ssh(`[ -f /root/.pm2/dump.pm2 ] && python3 -c "
import json
data=json.load(open('/root/.pm2/dump.pm2'))
names=[p.get('name','') for p in data]
print('YES' if '${pm2}' in names else 'NO')
" 2>/dev/null || echo "NO"`);
  checks.pm2SavedInDump = pm2Saved.includes('YES');
  if (!checks.pm2SavedInDump && checks.pm2Status === 'online') {
    issues.push({ sev: 'WARN', msg: 'Process not saved in pm2 dump (won\'t restart after reboot)' });
  }

  return { name, url, port, pm2, checks, issues, 
    criticals: issues.filter(i => i.sev === 'CRITICAL').length,
    warns: issues.filter(i => i.sev === 'WARN').length 
  };
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
const NODES = [
  { name: 'main-site', path: '/www/wwwroot/namainvist.com',  pm2: 'main-site', url: 'https://namainvist.com/', port: 2999 },
  { name: 'n1',  path: '/www/wwwroot/n1.namainvist.com',  pm2: 'n1-main', url: 'https://n1.namainvist.com/', port: 3001 },
  { name: 'n2',  path: '/www/wwwroot/n2.namainvist.com',  pm2: 'n2', url: 'https://n2.namainvist.com/', port: 3002 },
  { name: 'n3',  path: '/www/wwwroot/n3.namainvist.com',  pm2: 'n3', url: 'https://n3.namainvist.com/', port: 3003 },
  { name: 'n4',  path: '/www/wwwroot/n4.namainvist.com',  pm2: 'n4', url: 'https://n4.namainvist.com/', port: 3004 },
  { name: 'n5',  path: '/www/wwwroot/n5.namainvist.com',  pm2: 'n5', url: 'https://n5.namainvist.com/', port: 3005 },
  { name: 'n6',  path: '/www/wwwroot/n6.namainvist.com',  pm2: 'n6', url: 'https://n6.namainvist.com/', port: 3006 },
  { name: 'n7',  path: '/www/wwwroot/n7.namainvist.com',  pm2: 'n7', url: 'https://n7.namainvist.com/', port: 3007 },
  { name: 'n8',  path: '/www/wwwroot/n8.namainvist.com',  pm2: 'n8', url: 'https://n8.namainvist.com/', port: 3008 },
  { name: 'n9',  path: '/www/wwwroot/n9.namainvist.com',  pm2: 'n9', url: 'https://n9.namainvist.com/', port: 3009 },
  { name: 'n10', path: '/www/wwwroot/n10.namainvist.com', pm2: 'n10', url: 'https://n10.namainvist.com/', port: 3010 },
  { name: 'n11', path: '/www/wwwroot/n11.namainvist.com', pm2: 'n11', url: 'https://n11.namainvist.com/', port: 3011 },
  { name: 'ice', path: '/www/wwwroot/ice.namainvist.com', pm2: 'ice', url: 'https://ice.namainvist.com/', port: 3012 },
];

(async () => {
  process.stdout.write('🔍 Deep audit running (5 blocks × 13 nodes)...\n');
  const start = Date.now();

  // Run 2 nodes at a time to avoid SSH overload
  const results = [];
  for (let i = 0; i < NODES.length; i += 2) {
    const batch = NODES.slice(i, i + 2);
    const batchRes = await Promise.all(batch.map(deepAudit));
    results.push(...batchRes);
    process.stdout.write(`  ✓ ${Math.min(i+2, NODES.length)}/${NODES.length} done\n`);
  }

  // Also get global server checks
  process.stdout.write('  ✓ Running global server checks...\n');
  const serverDisk = await ssh("df -h / | tail -1");
  const serverMem = await ssh("free -m | grep Mem | awk '{printf \"%s/%s MB (%.0f%%)\", $3, $2, $3*100/$2}'");
  const serverLoad = await ssh("uptime | awk -F'load average:' '{print $2}'");
  const pm2DumpAge = await ssh("stat /root/.pm2/dump.pm2 2>/dev/null | grep Modify | cut -d' ' -f2-3 || echo 'MISSING'");
  const pm2Startup = await ssh("systemctl is-enabled pm2-root 2>/dev/null || echo 'NOT_CONFIGURED'");
  const allProcesses = await ssh("pm2 list 2>/dev/null | grep -v '│ id' | grep '│' | awk -F'│' '{print $3\"|\"$9}' | grep -v '^\\s*$' | head -20");

  fs.writeFileSync('deep-audit-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    server: { disk: serverDisk, memory: serverMem, load: serverLoad, pm2DumpAge, pm2Startup },
    nodes: results,
    duration: Date.now() - start
  }, null, 2));

  // Print summary
  const totalCriticals = results.reduce((s,r) => s + r.criticals, 0);
  const totalWarns = results.reduce((s,r) => s + r.warns, 0);
  const allIssues = results.flatMap(r => r.issues.map(i => ({ node: r.name, ...i })));
  
  process.stdout.write(`\n${'═'.repeat(60)}\n`);
  process.stdout.write(`  DEEP AUDIT COMPLETE — ${((Date.now()-start)/1000).toFixed(1)}s\n`);
  process.stdout.write(`  🔴 CRITICAL: ${totalCriticals} | 🟡 WARN: ${totalWarns}\n`);
  process.stdout.write(`${'═'.repeat(60)}\n\n`);
  
  // Print all issues
  allIssues.forEach(i => process.stdout.write(`  [${i.node}] ${i.sev === 'CRITICAL' ? '🔴' : '🟡'} ${i.msg}\n`));

  process.stdout.write(`\n\nGLOBAL SERVER:\n`);
  process.stdout.write(`  Disk: ${serverDisk}\n  RAM: ${serverMem}\n  Load: ${serverLoad}\n  PM2 Startup: ${pm2Startup}\n  PM2 Dump: ${pm2DumpAge}\n`);
  process.stdout.write(`\n  All PM2 processes:\n${allProcesses}\n`);
  process.stdout.write(`\nResults saved to deep-audit-results.json\n`);
})();
