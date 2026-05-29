const { Client } = require('ssh2');
const https = require('https');
const http = require('http');
const fs = require('fs');

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
    }).connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function httpCheck(url, headers = {}) {
  return new Promise(r => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 7000, headers: { 'User-Agent': 'audit/1.0', ...headers } }, res => {
      let body = '';
      res.on('data', d => { if (body.length < 4000) body += d; });
      res.on('end', () => r({
        status: res.statusCode,
        redirect: res.headers?.location,
        cfCache: res.headers?.['cf-cache-status'] || '-',
        cfRay: res.headers?.['cf-ray'] || '-',
        xNext: res.headers?.['x-nextjs-cache'] || '-',
        cacheControl: res.headers?.['cache-control'] || '-',
        age: res.headers?.['age'] || '0',
        body: body.substring(0, 2000),
        headers: res.headers,
      }));
    });
    req.on('error', e => r({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); r({ status: 0, error: 'TIMEOUT' }); });
  });
}

const L = (m) => process.stdout.write(m + '\n');
const H = (t) => L('\n' + '═'.repeat(55) + '\n  ' + t + '\n' + '═'.repeat(55));

(async () => {
  H('BLOCK 1: What is actually on the server RIGHT NOW');

  // 1a. What does the server (bypassing CF) return?
  L('→ Direct curl to port 2999...');
  const direct = await httpCheck('http://46.4.188.170:2999/', { 'Host': 'namainvist.com' });
  L(`  HTTP: ${direct.status} | Size: ${direct.body?.length || 0}`);
  
  // Check if body contains old or new content
  const body = direct.body || '';
  L(`  Contains "73": ${body.includes('73') ? '⚠️ YES (old)' : '✅ NO'}`);
  L(`  Contains "97": ${body.includes('97') ? '✅ YES (new)' : '❌ NO'}`);
  L(`  Contains "104": ${body.includes('104') ? '✅ YES' : '❌ NO'}`);
  L(`  Contains "LandingPage": ${body.includes('LandingPage') || body.includes('_landing') ? '✅ YES' : '❌ NO'}`);
  L(`  Contains "نظام مؤسسي": ${body.includes('نظام مؤسسي') ? '⚠️ OLD CONTENT' : '✅ NO'}`);
  L(`  Contains "نظام نما إنفست": ${body.includes('نظام نما إنفست') ? '✅ NEW CONTENT' : '❌ NO'}`);

  // 1b. What file is actually being used as landing?
  L('\n→ Server file check...');
  const fileCheck = await ssh(`
    echo "=== page.tsx ==="
    cat /www/wwwroot/namainvist.com/src/app/page.tsx
    echo "=== _landing.tsx first line ==="
    head -1 /www/wwwroot/namainvist.com/src/app/_landing.tsx
    echo "=== _landing.tsx contains old/new? ==="
    grep -c "نظام مؤسسي" /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null || echo "0"
    grep -c "نظام نما إنفست" /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null || echo "0"
    echo "=== Build ID ===" 
    cat /www/wwwroot/namainvist.com/.next/BUILD_ID 2>/dev/null
    echo "=== Last build time ==="
    stat /www/wwwroot/namainvist.com/.next/BUILD_ID 2>/dev/null | grep Modify || echo "unknown"
  `);
  L(fileCheck);

  H('BLOCK 2: Cloudflare Cache Analysis');

  // 2a. Via Cloudflare (public internet)
  L('→ Via Cloudflare (https://namainvist.com)...');
  const cf1 = await httpCheck('https://namainvist.com/');
  L(`  HTTP: ${cf1.status}`);
  L(`  CF-Cache-Status: ${cf1.cfCache}`);
  L(`  CF-Ray: ${cf1.cfRay}`);
  L(`  Age: ${cf1.age}s`);
  L(`  Cache-Control: ${cf1.cacheControl}`);
  L(`  Body: OldContent="${cf1.body?.includes('نظام مؤسسي') ? 'YES ⚠️' : 'NO ✅'}" | NewContent="${cf1.body?.includes('نظام نما إنفست') ? 'YES ✅' : 'NO ❌'}"`);

  // 2b. Force cache bypass via CF headers
  L('\n→ Cloudflare with Cache-Control: no-cache...');
  const cf2 = await httpCheck('https://namainvist.com/', { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
  L(`  HTTP: ${cf2.status} | CF-Cache: ${cf2.cfCache}`);
  L(`  Body: OldContent="${cf2.body?.includes('نظام مؤسسي') ? 'YES ⚠️' : 'NO ✅'}" | NewContent="${cf2.body?.includes('نظام نما إنفست') ? 'YES ✅' : 'NO ❌'}"`);

  // 2c. Bypass via query param
  L('\n→ Cloudflare bypass with ?v=...');
  const cf3 = await httpCheck(`https://namainvist.com/?v=${Date.now()}`);
  L(`  HTTP: ${cf3.status} | CF-Cache: ${cf3.cfCache}`);
  L(`  Body: OldContent="${cf3.body?.includes('نظام مؤسسي') ? 'YES ⚠️' : 'NO ✅'}" | NewContent="${cf3.body?.includes('نظام نما إنفست') ? 'YES ✅' : 'NO ❌'}"`);

  H('BLOCK 3: OLD vs NEW Landing Page Files');
  
  // Check both files
  const oldNew = await ssh(`
    echo "=== Files in /src/app/ ==="
    ls /www/wwwroot/namainvist.com/src/app/ | head -20
    echo ""
    echo "=== OLD _landing.tsx line count ==="
    wc -l /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null
    echo ""
    echo "=== _landing.tsx content grep for key strings ==="
    grep -n "73\\|97\\|104\\|نظام مؤسسي\\|نظام نما\\|مجموعة الأنظمة\\|LandingPage\\|export default" /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null | head -15
    echo ""
    echo "=== OLD landing check (any file named differently?) ==="
    grep -rl "73 قسم\\|نظام مؤسسي متكامل" /www/wwwroot/namainvist.com/src/app/ 2>/dev/null | head -5
  `);
  L(oldNew);

  H('BLOCK 4: GlobalAuthGuard Check');
  const guard = await ssh(`
    echo "=== GlobalAuthGuard on server ==="
    grep -n "publicRoutes\\|'/'\\|namainvist\\|provisioning" /www/wwwroot/namainvist.com/src/components/GlobalAuthGuard.tsx 2>/dev/null
  `);
  L(guard);

  H('BLOCK 5: Nginx Config for namainvist.com');
  const nginx = await ssh(`
    # Find nginx config
    for f in /www/server/panel/vhost/nginx/namainvist.com.conf \
              /etc/nginx/sites-available/namainvist.com \
              /etc/nginx/conf.d/namainvist.com.conf; do
      [ -f "$f" ] && echo "FOUND: $f" && cat "$f" | grep -v "^#" | grep -v "^$" | head -30 && break
    done
    # Alternative: find any conf mentioning 2999
    grep -rl "2999" /etc/nginx/ /www/server/panel/vhost/nginx/ 2>/dev/null | head -3
  `);
  L(nginx);

  H('SUMMARY & DIAGNOSIS');

  const isOldOnServer = body.includes('نظام مؤسسي');
  const isNewOnServer = body.includes('نظام نما إنفست') || body.includes('97') || body.includes('MODULES_DATA');
  const cfServingOld = cf1.body?.includes('نظام مؤسسي');
  const cfServingNew = cf1.body?.includes('نظام نما إنفست');

  L('\nRoot Cause Analysis:');
  if (isOldOnServer) {
    L('  🔴 Server is STILL serving OLD content (not just CF cache issue)');
    L('  → The _landing.tsx on server has OLD content OR not used');
  } else if (isNewOnServer) {
    if (cfServingOld) {
      L('  🟡 Server has NEW content but Cloudflare is caching OLD version');
      L('  → Solution: Purge Cloudflare cache');
    } else {
      L('  ✅ Both server and Cloudflare serving NEW content');
    }
  } else {
    L('  ❓ Cannot determine content (may be client-side rendered only)');
    L('  → The page content is loaded via JavaScript (no SSR)');
  }

  // Save results
  fs.writeFileSync('landing-diagnosis.json', JSON.stringify({
    server: { status: direct.status, hasOld: isOldOnServer, hasNew: isNewOnServer },
    cloudflare: { 
      status: cf1.status, cfCache: cf1.cfCache, age: cf1.age,
      servesOld: cfServingOld, servesNew: cfServingNew
    }
  }, null, 2));

  L('\nResults saved to landing-diagnosis.json');
})();
