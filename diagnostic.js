const { Client } = require('ssh2');
const https = require('https');

const SERVER = '46.4.188.170';

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
    }).connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function httpGet(url) {
  return new Promise(r => {
    https.get(url, { timeout: 5000, headers: { 'User-Agent': 'curl' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => r({ status: res.statusCode, headers: res.headers, body: data.substring(0, 500) }));
    }).on('error', e => r({ error: e.message })).end();
  });
}

(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('    🔍 COMPREHENSIVE DIAGNOSTIC REPORT');
  console.log('═══════════════════════════════════════════════════\n');

  // ─── 1. What does each domain actually serve? ───────────────────
  console.log('📡 1. LIVE HTTP RESPONSES:\n');
  
  const domains = [
    'https://namainvist.com/',
    'https://namainvist.com/sign-in',
    'https://n1.namainvist.com/',
    'https://n11.namainvist.com/',
  ];
  
  for (const url of domains) {
    const res = await httpGet(url);
    const location = res.headers?.location || '';
    const contentSnippet = res.body?.match(/نظام مؤسسي|104 وحدة|73 قسم|تسجيل الدخول|sign-in|dashboard/)?.[0] || 'unknown';
    console.log(`  ${url}`);
    console.log(`    Status: ${res.status} ${location ? '→ ' + location : ''}`);
    console.log(`    Content: ${contentSnippet}`);
    console.log(`    Cache: ${res.headers?.['x-nextjs-cache'] || res.headers?.['cf-cache-status'] || 'N/A'}\n`);
  }

  // ─── 2. PM2 Processes & Ports ────────────────────────────────────
  console.log('\n📦 2. PM2 PROCESSES:\n');
  const pm2 = await ssh("pm2 list 2>/dev/null | grep -E 'name|main-site|n1|n11|id|port' | head -40");
  console.log(pm2);

  // ─── 3. Nginx Routing ────────────────────────────────────────────
  console.log('\n🌐 3. NGINX ROUTING OVERVIEW:\n');
  
  // namainvist.com
  const mainNginx = await ssh("cat /etc/nginx/sites-available/namainvist.com 2>/dev/null | grep -E 'server_name|proxy_pass|listen|root' | head -20");
  console.log('  namainvist.com nginx:\n   ', mainNginx.split('\n').join('\n    '));
  
  // n1
  const n1Nginx = await ssh("cat /etc/nginx/sites-available/n1.namainvist.com 2>/dev/null || grep -r 'n1.namainvist' /etc/nginx/ /www/server/panel/vhost/ 2>/dev/null | grep 'proxy_pass' | head -5");
  console.log('\n  n1 nginx:\n   ', n1Nginx.split('\n').join('\n    '));

  // ─── 4. Source Files State ───────────────────────────────────────
  console.log('\n\n📁 4. SOURCE FILES STATE:\n');
  
  // namainvist.com page.tsx
  const mainPage = await ssh("head -5 /www/wwwroot/namainvist.com/src/app/page.tsx 2>/dev/null");
  const mainPageLines = await ssh("wc -l /www/wwwroot/namainvist.com/src/app/page.tsx 2>/dev/null");
  console.log('  namainvist.com/src/app/page.tsx:');
  console.log('   ', mainPage.split('\n').slice(0,3).join('\n    '));
  console.log('   ', mainPageLines);
  
  // namainvist.com _landing.tsx
  const landing = await ssh("ls -la /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null || echo 'NOT FOUND'");
  console.log('\n  _landing.tsx:', landing);
  
  // n1 page.tsx
  const n1Page = await ssh("head -5 /www/wwwroot/n1.namainvist.com/src/app/page.tsx 2>/dev/null");
  const n1PageLines = await ssh("wc -l /www/wwwroot/n1.namainvist.com/src/app/page.tsx 2>/dev/null");
  console.log('\n  n1.namainvist.com/src/app/page.tsx:');
  console.log('   ', n1Page.split('\n').slice(0, 3).join('\n    '));
  console.log('   ', n1PageLines);

  // ─── 5. Middleware State ─────────────────────────────────────────
  console.log('\n\n🔒 5. MIDDLEWARE STATE:\n');
  
  const mainMw = await ssh("grep -E 'isPublicRoute|pathname|sign-in|isMainSite' /www/wwwroot/namainvist.com/src/middleware.ts 2>/dev/null | head -15");
  console.log('  namainvist.com middleware:\n   ', mainMw.split('\n').join('\n    '));
  
  const n1Mw = await ssh("head -10 /www/wwwroot/n1.namainvist.com/src/middleware.ts 2>/dev/null");
  console.log('\n  n1 middleware:\n   ', n1Mw.split('\n').slice(0,5).join('\n    '));

  // ─── 6. Built Output State ───────────────────────────────────────
  console.log('\n\n🏗️ 6. BUILT OUTPUT:\n');
  
  const mainBuilt = await ssh("ls /www/wwwroot/namainvist.com/.next/server/app/index.html 2>/dev/null && echo 'STATIC(BAD)' || echo 'DYNAMIC(GOOD)'");
  console.log('  namainvist.com index.html:', mainBuilt);
  
  const n1Built = await ssh("ls /www/wwwroot/n1.namainvist.com/.next/server/app/index.html 2>/dev/null && echo 'STATIC' || echo 'DYNAMIC/MISSING'");
  console.log('  n1. index.html:', n1Built);

  // ─── 7. What does n1 root page actually render? ──────────────────
  console.log('\n\n🧩 7. N1 ROOT PAGE CONTENT:\n');
  const n1PageContent = await ssh("cat /www/wwwroot/n1.namainvist.com/src/app/page.tsx 2>/dev/null | head -20");
  console.log(n1PageContent);

  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('    📊 DIAGNOSTIC COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
})();
