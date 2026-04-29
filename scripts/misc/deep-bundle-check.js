const { Client } = require('ssh2');
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
    }).connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const L = (m) => process.stdout.write(m + '\n');
const H = (t) => L('\n' + '═'.repeat(55) + '\n  ' + t + '\n' + '═'.repeat(55));

(async () => {
  H('BLOCK A: Built JS Bundles — Old or New Content?');

  L('→ Searching compiled .next chunks for old/new content...');
  const chunksOld = await ssh(`
    grep -rl "نظام مؤسسي متكامل\\|73 قسم" /www/wwwroot/namainvist.com/.next/static/chunks/ 2>/dev/null | wc -l
  `);
  const chunksNew = await ssh(`
    grep -rl "104 وحدة\\|استعرض الـ 104" /www/wwwroot/namainvist.com/.next/static/chunks/ 2>/dev/null | wc -l
  `);
  L(`  Chunks with OLD content (73/نظام مؤسسي): ${chunksOld} files`);
  L(`  Chunks with NEW content (104/dark hero):  ${chunksNew} files`);

  // Find the actual chunk file containing landing page
  L('\n→ Finding which chunk contains the landing page component...');
  const landingChunk = await ssh(`
    grep -rl "MODULES_DATA\\|activeTab\\|104 وحدة" /www/wwwroot/namainvist.com/.next/static/chunks/ 2>/dev/null | head -3
  `);
  L(`  Landing page chunk files:\n${landingChunk || '  NONE FOUND ❌'}`);

  H('BLOCK B: Service Worker Status');

  L('→ Checking service worker file...');
  const swFile = await ssh(`
    # Find sw.js or any service worker
    find /www/wwwroot/namainvist.com -name "sw.js" -o -name "service-worker.js" -o -name "workbox*.js" 2>/dev/null | head -5
  `);
  L(`  SW files found:\n${swFile || '  none'}`);

  const swContent = await ssh(`
    SW=$(find /www/wwwroot/namainvist.com/public -name "sw.js" 2>/dev/null | head -1)
    if [ -f "$SW" ]; then 
      echo "SIZE: $(wc -c < $SW) bytes"
      echo "CACHENAME: $(grep -o 'CACHE_NAME.*\\|cacheName.*' $SW | head -2)"
      echo "VERSION: $(grep -o 'version.*[0-9]' $SW | head -1)"
    fi
    # Also check .next folder
    find /www/wwwroot/namainvist.com/.next -name "sw.js" 2>/dev/null && echo "Found in .next" || echo "Not in .next"
  `);
  L(`  SW details:\n${swContent}`);

  H('BLOCK C: pm2 main-site Logs (Last 30 lines)');

  const logs = await ssh(`pm2 logs main-site --lines 30 --nostream 2>&1 | tail -30`);
  L(logs);

  H('BLOCK D: What page.tsx ACTUALLY imports and renders');

  L('→ Full page.tsx chain...');
  const pageChain = await ssh(`
    echo "=== /src/app/page.tsx ==="
    cat /www/wwwroot/namainvist.com/src/app/page.tsx
    echo ""
    echo "=== _landing.tsx key sections ==="
    grep -n "export default\\|function Landing\\|return\\|nav\\|section\\|hero\\|73\\|97\\|104\\|dark\\|from-slate-900\\|from-indigo\\|نظام مؤسسي\\|نظام نما" \
      /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null | head -20
  `);
  L(pageChain);

  H('BLOCK E: SSR vs CSR — Is Content in HTML?');

  L('→ Checking what SSR renders (raw HTML from next server)...');
  const ssrCheck = await ssh(`
    # Use curl to hit the Node server directly (not nginx/CF)
    curl -s --max-time 8 http://localhost:2999/ 2>/dev/null | \
    python3 -c "
import sys
html = sys.stdin.read()
body_start = html.find('<body')
body_end = html.find('</body>')
body = html[body_start:body_end] if body_start >= 0 else html[:500]
print('BODY LENGTH:', len(body))
print('HAS OLD (73):', '73' in html)
print('HAS OLD (مؤسسي):', 'مؤسسي' in html) 
print('HAS NEW (104 وحدة):', '104 وحدة' in html)
print('HAS DARK HERO (from-slate-900):', 'from-slate-900' in html or 'slate-900' in html)
print('CLIENT ONLY (hidden div):', '<!--\$-->' in html)
print('FIRST 200 BODY:', repr(body[:200]))
" 2>/dev/null || echo "Could not connect to localhost:2999"
  `);
  L(ssrCheck);

  H('BLOCK F: Nginx Proxy Config — Is it pointing to right port?');

  const proxyConf = await ssh(`
    echo "=== proxy.conf ==="  
    cat /www/server/panel/vhost/nginx/proxy/namainvist.com/proxy.conf 2>/dev/null || echo "NOT FOUND"
    echo ""
    echo "=== Extension configs ==="
    ls /www/server/panel/vhost/nginx/extension/namainvist.com/ 2>/dev/null
    cat /www/server/panel/vhost/nginx/extension/namainvist.com/*.conf 2>/dev/null | grep -E "proxy_pass|port|localhost" | head -10
  `);
  L(proxyConf);

  H('BLOCK G: Build Validity Check');

  const buildCheck = await ssh(`
    echo "=== Build ID ==="
    cat /www/wwwroot/namainvist.com/.next/BUILD_ID 
    echo ""
    echo "=== pages-manifest.json — does it show correct landing? ==="
    python3 -c "
import json
try:
  d = json.load(open('/www/wwwroot/namainvist.com/.next/server/pages-manifest.json'))
  print('pages-manifest keys:', list(d.keys())[:5])
except:
  pass

try:
  d = json.load(open('/www/wwwroot/namainvist.com/.next/routes-manifest.json'))
  routes = d.get('staticRoutes', []) + d.get('dynamicRoutes', [])
  print('Routes:', [r.get('page','') for r in routes[:10]])
except Exception as e:
  print('routes-manifest error:', e)
" 2>/dev/null
    echo ""
    echo "=== .next/server/app/ contents ==="
    ls /www/wwwroot/namainvist.com/.next/server/app/ 2>/dev/null | head -10
    echo ""
    echo "=== page.js exists in build? ==="
    find /www/wwwroot/namainvist.com/.next -name "page.js" | head -5
  `);
  L(buildCheck);

  H('FINAL DIAGNOSIS SUMMARY');

  const hasOldChunks = parseInt(chunksOld) > 0;
  const hasNewChunks = parseInt(chunksNew) > 0;

  if (hasOldChunks && !hasNewChunks) {
    L('  🔴 ROOT CAUSE: Built JS bundles have OLD content!');
    L('  → The new _landing.tsx was NOT compiled into the build');
    L('  → Need: nuclear clean rebuild (rm -rf .next node_modules/.cache && npm run build)');
  } else if (!hasOldChunks && hasNewChunks) {
    L('  ✅ Built JS has NEW content. Issue is browser/SW cache');
    L('  → User needs to clear browser cache (Ctrl+Shift+Delete)');
    L('  → Or service worker is serving old version');
  } else if (!hasOldChunks && !hasNewChunks) {
    L('  ❓ Landing page content NOT FOUND in chunks at all!');
    L('  → _landing.tsx may have a compile error OR wrong export');
    L('  → Need: check build errors and rebuild');
  } else {
    L('  ⚠️ Both old AND new content in chunks (partial rebuild)');
    L('  → Need: clean rebuild to remove old chunks');
  }
})();
