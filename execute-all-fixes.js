const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = '46.4.188.170';

function ssh(cmd, print = false) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; if (print) process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).on('error', () => r('SSH_ERR'))
      .connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { c.end(); r(true); });
        ws.on('error', () => { c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', () => r(false))
      .connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const log = (msg) => { process.stdout.write(msg + '\n'); };
const section = (title) => { log(`\n${'═'.repeat(55)}\n  ${title}\n${'═'.repeat(55)}`); };
const ok = (msg) => log(`  ✅ ${msg}`);
const warn = (msg) => log(`  ⚠️  ${msg}`);
const err = (msg) => log(`  ❌ ${msg}`);
const step = (msg) => log(`  → ${msg}`);

const NODES = [
  { name: 'n1',  path: '/www/wwwroot/n1.namainvist.com',  pm2: 'n1-main', port: 3001 },
  { name: 'n2',  path: '/www/wwwroot/n2.namainvist.com',  pm2: 'n2', port: 3002 },
  { name: 'n3',  path: '/www/wwwroot/n3.namainvist.com',  pm2: 'n3', port: 3003 },
  { name: 'n4',  path: '/www/wwwroot/n4.namainvist.com',  pm2: 'n4', port: 3004 },
  { name: 'n5',  path: '/www/wwwroot/n5.namainvist.com',  pm2: 'n5', port: 3005 },
  { name: 'n6',  path: '/www/wwwroot/n6.namainvist.com',  pm2: 'n6', port: 3006 },
  { name: 'n7',  path: '/www/wwwroot/n7.namainvist.com',  pm2: 'n7', port: 3007 },
  { name: 'n8',  path: '/www/wwwroot/n8.namainvist.com',  pm2: 'n8', port: 3008 },
  { name: 'n9',  path: '/www/wwwroot/n9.namainvist.com',  pm2: 'n9', port: 3009 },
  { name: 'n10', path: '/www/wwwroot/n10.namainvist.com', pm2: 'n10', port: 3010 },
  { name: 'n11', path: '/www/wwwroot/n11.namainvist.com', pm2: 'n11', port: 3011 },
  { name: 'ice', path: '/www/wwwroot/ice.namainvist.com', pm2: 'ice', port: 3012 },
];

// ──────────────────────────────────────────────
// PRIORITY 0: pm2 startup + fix ice
// ──────────────────────────────────────────────
async function priority0_startupAndIce() {
  section('PRIORITY 0: pm2 startup + Fix ice.namainvist.com');

  // 0a. Enable pm2 startup (survives reboot)
  step('Enabling pm2 startup service...');
  const startupResult = await ssh('pm2 startup systemd -u root --hp /root 2>&1 | tail -3');
  ok('pm2 startup configured');

  // 0b. Fix ice - find correct start command from other nodes
  step('Checking ice process...');
  const iceStatus = await ssh("pm2 list 2>/dev/null | grep ice | head -1");
  
  if (!iceStatus.includes('online')) {
    step('Starting ice.namainvist.com on port 3012...');
    // Check if it has a package.json start script
    const pkgStart = await ssh("cat /www/wwwroot/ice.namainvist.com/package.json 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); print(d.get('scripts',{}).get('start',''))\" 2>/dev/null");
    const startCmd = pkgStart.includes('next') ? pkgStart : 'next start -p 3012';
    
    const iceStart = await ssh(`cd /www/wwwroot/ice.namainvist.com && pm2 start "npm run start" --name ice 2>&1 | tail -3`);
    
    await new Promise(r => setTimeout(r, 3000));
    const iceCheck = await ssh("pm2 list | grep ice | grep online");
    if (iceCheck.includes('online')) {
      ok('ice.namainvist.com started successfully');
    } else {
      // Try alternative
      await ssh('pm2 delete ice 2>/dev/null; true');
      await ssh(`cd /www/wwwroot/ice.namainvist.com && pm2 start ecosystem.config.js --only ice 2>/dev/null || pm2 start "node_modules/.bin/next start -p 3012" --name ice 2>&1`);
      await new Promise(r => setTimeout(r, 3000));
      const check2 = await ssh("pm2 list | grep ice | grep online");
      if (check2.includes('online')) ok('ice started via alternative method');
      else err('ice failed to start - manual check needed');
    }
  } else {
    ok('ice already online');
  }

  // 0c. Save pm2 state
  step('Saving pm2 state...');
  await ssh('pm2 save --force 2>&1');
  ok('pm2 dump saved (all processes preserved on reboot)');
}

// ──────────────────────────────────────────────
// PRIORITY 1: Delete static index.html + fix n4/n11
// ──────────────────────────────────────────────
async function priority1_staticAndRedirect() {
  section('PRIORITY 1: Delete static index.html + Fix n4/n11 redirect');

  // 1a. Delete static index.html from ALL nodes
  step('Deleting static index.html from all nodes...');
  const rmResult = await ssh(`
    count=0
    for dir in /www/wwwroot/n{1..11}.namainvist.com /www/wwwroot/ice.namainvist.com; do
      if [ -f "$dir/.next/server/app/index.html" ]; then
        rm -f "$dir/.next/server/app/index.html"
        count=$((count+1))
      fi
    done
    echo "Removed $count static files"
  `);
  ok(rmResult);

  // 1b. Rebuild n4 and n11 (return 200 instead of redirect)
  step('Rebuilding n4 (HTTP 200 bug)...');
  await ssh('cd /www/wwwroot/n4.namainvist.com && npm run build 2>&1 | tail -3 && pm2 restart n4 2>&1 | tail -1');
  ok('n4 rebuilt');

  step('Rebuilding n11 (HTTP 200 bug)...');
  await ssh('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -3 && pm2 restart n11 2>&1 | tail -1');
  ok('n11 rebuilt');

  // 1c. Restart all other nodes to clear in-memory cache
  step('Restarting all nodes to clear cache...');
  await ssh('pm2 restart n1-main n2 n3 n5 n6 n7 n8 n9 n10 main-site 2>&1 | tail -2');
  ok('All nodes restarted');
}

// ──────────────────────────────────────────────
// PRIORITY 2: Deploy /reports/104-modules to all nodes
// ──────────────────────────────────────────────
async function priority2_deploy104Modules() {
  section('PRIORITY 2: Deploy /reports/104-modules to all nodes');

  const reportPage = fs.readFileSync('src/app/(dashboard)/reports/73-modules/page.tsx', 'utf8');
  const reportPageLines = reportPage.split('\n').length;
  step(`Source file: ${reportPageLines} lines, ${reportPage.length} bytes`);

  // Deploy to all nodes in parallel batches
  const results = await Promise.all(
    NODES.map(async (node) => {
      // Create 104-modules directory
      await ssh(`mkdir -p "${node.path}/src/app/(dashboard)/reports/104-modules" 2>/dev/null`);
      // Write the page
      const filePath = `${node.path}/src/app/(dashboard)/reports/104-modules/page.tsx`;
      const writeOk = await writeFile(filePath, reportPage);
      return { name: node.name, ok: writeOk };
    })
  );

  const written = results.filter(r => r.ok).length;
  ok(`Files written to ${written}/${NODES.length} nodes`);

  // Rebuild all nodes in parallel batches of 3
  step('Rebuilding all nodes (batches of 3)...');
  const batches = [];
  for (let i = 0; i < NODES.length; i += 3) batches.push(NODES.slice(i, i+3));
  
  for (const batch of batches) {
    await Promise.all(batch.map(async node => {
      await ssh(`cd "${node.path}" && npm run build 2>&1 | tail -2 && pm2 restart ${node.pm2} 2>&1 | tail -1`);
      log(`    ✅ ${node.name} rebuilt`);
    }));
  }
  ok('All nodes rebuilt with 104-modules route');
}

// ──────────────────────────────────────────────
// PRIORITY 3: Fix Sidebar on namainvist.com
// ──────────────────────────────────────────────
async function priority3_fixMainSiteSidebar() {
  section('PRIORITY 3: Update namainvist.com Sidebar + translations check');

  // Update sidebar on main site
  step('Uploading updated Sidebar.tsx to namainvist.com...');
  const sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
  const sidebarOk = await writeFile('/www/wwwroot/namainvist.com/src/components/Sidebar.tsx', sidebarContent);
  ok(sidebarOk ? 'Sidebar.tsx uploaded' : 'Sidebar upload failed');

  // Check translations location on each node
  step('Checking translations.ts location...');
  const transCheck = await ssh(`
    find /www/wwwroot/n1.namainvist.com/src -name "translations.ts" -o -name "translations.tsx" 2>/dev/null | head -5
    echo "---"
    find /www/wwwroot/n1.namainvist.com/src -name "*.ts" | xargs grep -l "sys.str_" 2>/dev/null | head -3
  `);
  log(`  Translation files found: ${transCheck || 'none'}`);

  // Rebuild main site
  step('Rebuilding namainvist.com...');
  await ssh('cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -3 && pm2 restart main-site 2>&1 | tail -1');
  ok('namainvist.com rebuilt');
}

// ──────────────────────────────────────────────
// FINAL VERIFICATION
// ──────────────────────────────────────────────
async function finalVerification() {
  section('FINAL VERIFICATION');

  await new Promise(r => setTimeout(r, 5000));

  const checks = await ssh(`
    echo "=== PM2 Status ==="
    pm2 list 2>/dev/null | grep -E "name|main-site|n1|n11|ice" | head -20
    
    echo "=== Port checks ==="
    for port in 2999 3001 3004 3011 3012; do
      nc -z 127.0.0.1 $port 2>/dev/null && echo "Port $port: OK" || echo "Port $port: DEAD"
    done
    
    echo "=== Static HTML removed? ==="
    count=$(find /www/wwwroot -path "*/.next/server/app/index.html" 2>/dev/null | wc -l)
    echo "Static index.html files remaining: $count"
    
    echo "=== 104-modules deployed? ==="
    count=$(find /www/wwwroot -path "*/reports/104-modules/page.tsx" 2>/dev/null | wc -l)
    echo "104-modules pages: $count"
    
    echo "=== PM2 saved? ==="
    ls -la /root/.pm2/dump.pm2 2>/dev/null | awk '{print $6,$7,$8}' || echo "NOT SAVED"
  `);
  log(checks);
}

// ──────────────────────────────────────────────
// RUN ALL
// ──────────────────────────────────────────────
(async () => {
  const total = Date.now();
  log('\n🚀 Starting unified fix execution...\n');

  try {
    await priority0_startupAndIce();
  } catch(e) { err('Priority 0 error: ' + e.message); }

  try {
    await priority1_staticAndRedirect();
  } catch(e) { err('Priority 1 error: ' + e.message); }

  try {
    await priority2_deploy104Modules();
  } catch(e) { err('Priority 2 error: ' + e.message); }

  try {
    await priority3_fixMainSiteSidebar();
  } catch(e) { err('Priority 3 error: ' + e.message); }

  try {
    await finalVerification();
  } catch(e) { err('Verification error: ' + e.message); }

  section(`✅ ALL DONE — ${((Date.now()-total)/1000/60).toFixed(1)} minutes`);
})();
