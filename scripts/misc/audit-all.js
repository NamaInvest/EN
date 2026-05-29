const { Client } = require('ssh2');
const https = require('https');
const http = require('http');
const fs = require('fs');

const SERVER = '46.4.188.170';

// ──────────────────────────────────────────────────────────────────
// SSH Helper
// ──────────────────────────────────────────────────────────────────
function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).on('error', () => r('SSH_ERR'))
      .connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

// ──────────────────────────────────────────────────────────────────
// HTTP Check
// ──────────────────────────────────────────────────────────────────
function httpCheck(url, timeout = 6000) {
  return new Promise(r => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout, headers: { 'User-Agent': 'audit-bot/1.0' } }, res => {
      let body = '';
      res.on('data', d => { if (body.length < 2000) body += d; });
      res.on('end', () => r({
        status: res.statusCode,
        redirect: res.headers?.location || null,
        cfCache: res.headers?.['cf-cache-status'] || '-',
        nextCache: res.headers?.['x-nextjs-cache'] || '-',
        cacheControl: res.headers?.['cache-control'] || '-',
        body: body,
      }));
    });
    req.on('error', e => r({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); r({ status: 0, error: 'TIMEOUT' }); });
  });
}

// ──────────────────────────────────────────────────────────────────
// Node Audit
// ──────────────────────────────────────────────────────────────────
async function auditNode(node) {
  const { name, path, pm2, url, port } = node;
  const issues = [];
  const info = {};

  // ── 1. PM2 status ───────────────────────────────────────────────
  const pm2Status = await ssh(`pm2 jlist 2>/dev/null | python3 -c "
import json,sys
data=json.load(sys.stdin)
for p in data:
  if p['name']=='${pm2}':
    print(p['pm2_env']['status']+'|'+str(p['pid'])+'|'+str(p['pm2_env'].get('restart_time',0)))
    break
" 2>/dev/null || echo "NOT_FOUND"`);

  const [pmStatus, pmPid, pmRestarts] = pm2Status.includes('|') ? pm2Status.split('|') : [pm2Status, '-', '-'];
  info.pm2 = pmStatus.trim() || 'NOT_FOUND';
  info.pid = pmPid;
  info.restarts = pmRestarts;
  if (info.pm2 !== 'online') issues.push({ sev: '🔴 CRITICAL', msg: `PM2 process "${pm2}" is ${info.pm2}` });
  else if (parseInt(pmRestarts) > 30) issues.push({ sev: '🟡 WARN', msg: `High restarts: ${pmRestarts}` });

  // ── 2. Port listening ────────────────────────────────────────────
  const portCheck = await ssh(`ss -tlnp 2>/dev/null | grep ":${port} " | head -1 || echo "NOT_LISTENING"`);
  info.portListening = !portCheck.includes('NOT_LISTENING');
  if (!info.portListening) issues.push({ sev: '🔴 CRITICAL', msg: `Port ${port} not listening` });

  // ── 3. page.tsx check ───────────────────────────────────────────
  const pageLines = await ssh(`wc -l < "${path}/src/app/page.tsx" 2>/dev/null || echo "0"`);
  const pageHead = await ssh(`head -3 "${path}/src/app/page.tsx" 2>/dev/null || echo "NOT_FOUND"`);
  info.pageLines = parseInt(pageLines) || 0;
  info.pageType = pageHead.includes('LandingPage') ? 'LANDING_WRAPPER' :
                  pageHead.includes('redirect') ? 'ERP_REDIRECT' :
                  pageHead.includes('use client') ? 'CLIENT_COMPONENT' : 'OTHER';

  if (name === 'main-site') {
    if (info.pageType !== 'LANDING_WRAPPER') issues.push({ sev: '🟡 WARN', msg: `page.tsx should be LANDING_WRAPPER, got ${info.pageType}` });
  } else {
    if (info.pageType === 'CLIENT_COMPONENT' && info.pageLines > 50) {
      issues.push({ sev: '🔴 CRITICAL', msg: `page.tsx has ${info.pageLines} lines (marketing landing page on ERP node!)` });
    }
  }

  // ── 4. Static index.html (cache trap) ───────────────────────────
  const staticHtml = await ssh(`ls "${path}/.next/server/app/index.html" 2>/dev/null && echo "PRESENT" || echo "OK"`);
  info.staticHtml = staticHtml.includes('PRESENT') ? 'PRESENT(BAD)' : 'OK';
  if (info.staticHtml !== 'OK' && name !== 'main-site') {
    issues.push({ sev: '🟡 WARN', msg: 'Static index.html present - may serve stale content' });
  }

  // ── 5. .next build exists ────────────────────────────────────────
  const buildId = await ssh(`cat "${path}/.next/BUILD_ID" 2>/dev/null || echo "NO_BUILD"`);
  info.buildId = buildId.includes('NO_BUILD') ? 'NO_BUILD' : buildId.substring(0, 12);
  if (info.buildId === 'NO_BUILD') issues.push({ sev: '🔴 CRITICAL', msg: 'No .next build found - needs npm run build' });

  // ── 6. Sidebar has 104 ──────────────────────────────────────────
  const sidebarCheck = await ssh(`grep -c "104" "${path}/src/components/Sidebar.tsx" 2>/dev/null || echo "0"`);
  info.sidebar104 = parseInt(sidebarCheck) > 0;
  if (!info.sidebar104) issues.push({ sev: '🟡 WARN', msg: 'Sidebar still references old 73 labels' });

  // ── 7. Report page (104-modules) ────────────────────────────────
  const has104Page = await ssh(`ls "${path}/src/app/(dashboard)/reports/104-modules/page.tsx" 2>/dev/null && echo "YES" || echo "NO"`);
  info.has104Page = has104Page.includes('YES');
  if (!info.has104Page && name !== 'main-site') {
    issues.push({ sev: '🟡 WARN', msg: 'Missing /reports/104-modules route' });
  }

  // ── 8. HTTP check ────────────────────────────────────────────────
  const httpResult = await httpCheck(url);
  info.httpStatus = httpResult.status;
  info.cfCache = httpResult.cfCache;
  info.nextCache = httpResult.nextCache;
  info.redirect = httpResult.redirect;

  if (httpResult.status === 0) {
    issues.push({ sev: '🔴 CRITICAL', msg: `HTTP unreachable: ${httpResult.error}` });
  } else if (httpResult.status >= 500) {
    issues.push({ sev: '🔴 CRITICAL', msg: `HTTP ${httpResult.status} error` });
  } else if (httpResult.status >= 400) {
    issues.push({ sev: '🟡 WARN', msg: `HTTP ${httpResult.status}` });
  }

  // For n1-n11, check if homepage redirects to sign-in
  if (name !== 'main-site') {
    if (httpResult.status === 200 && !httpResult.redirect) {
      // Check if body has sign-in redirect indication
      const bodyHasSignIn = httpResult.body?.includes('sign-in') || httpResult.body?.includes('Sign In');
      if (!bodyHasSignIn && info.pageType !== 'ERP_REDIRECT') {
        // May be showing landing page still
        issues.push({ sev: '🟡 WARN', msg: 'Root path returns 200 without sign-in redirect (check browser behavior)' });
      }
    }
  }

  // ── 9. Nginx config ──────────────────────────────────────────────
  const nginxCheck = await ssh(`
    # Check all possible nginx config locations
    for f in /etc/nginx/sites-available/${url.replace('https://','').replace('http://','').replace('/','')}.conf \
              /www/server/panel/vhost/nginx/${url.replace('https://','').replace('http://','').replace('/','')}.conf \
              /etc/nginx/conf.d/${url.replace('https://','').replace('http://','').replace('/','')}.conf; do
      [ -f "$f" ] && echo "FOUND:$f" && break
    done
    echo "DONE"
  `);
  info.nginxFound = nginxCheck.includes('FOUND');

  return { name, url, port, pm2, info, issues };
}

// ──────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────
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
  console.log('Running full audit... this takes ~60 seconds\n');
  const startTime = Date.now();

  // Run in parallel batches of 4
  const results = [];
  for (let i = 0; i < NODES.length; i += 4) {
    const batch = NODES.slice(i, i + 4);
    const batchResults = await Promise.all(batch.map(auditNode));
    results.push(...batchResults);
    process.stdout.write(`  Audited ${Math.min(i+4, NODES.length)}/${NODES.length} nodes...\n`);
  }

  // ── Summary stats ──────────────────────────────────────────────
  const totalIssues = results.reduce((s, r) => s + r.issues.length, 0);
  const criticalCount = results.reduce((s, r) => s + r.issues.filter(i => i.sev.includes('CRITICAL')).length, 0);
  const warnCount = results.reduce((s, r) => s + r.issues.filter(i => i.sev.includes('WARN')).length, 0);

  // Save raw data
  fs.writeFileSync('audit-results.json', JSON.stringify(results, null, 2));

  console.log('\n' + JSON.stringify({ results, summary: { totalIssues, criticalCount, warnCount, duration: Date.now() - startTime } }, null, 2));
})();
