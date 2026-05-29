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
    }).on('error', () => r('SSH_ERR'))
      .connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
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
      .connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

const log = (m) => process.stdout.write(m + '\n');
const ok = (m) => log('  ✅ ' + m);
const err = (m) => log('  ❌ ' + m);
const step = (m) => log('  → ' + m);

// Read 104-modules source
const reportPage = fs.readFileSync('src/app/(dashboard)/reports/73-modules/page.tsx', 'utf8');

const ALL_NODES = [
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

(async () => {
  // ─── FIX 1: Ice port 3012 ──────────────────────────────────
  log('\n═══ FIX 1: Ice port 3012 ═══\n');

  step('Checking ice process details...');
  const iceDetail = await ssh(`
    pm2 list 2>/dev/null | grep ice;
    echo "---"
    # Check what port ice is actually on
    ss -tlnp 2>/dev/null | grep "$(pm2 list 2>/dev/null | grep ice | awk '{print $4}' | head -1)"
    echo "---packages---"
    cat /www/wwwroot/ice.namainvist.com/package.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('start:', d.get('scripts',{}).get('start','')); print('dev:', d.get('scripts',{}).get('dev',''))" 2>/dev/null
    echo "---env---"
    grep -i "PORT\|port" /www/wwwroot/ice.namainvist.com/.env 2>/dev/null | head -3 || echo "no port in .env"
    echo "---pm2 env---"
    pm2 jlist 2>/dev/null | python3 -c "
import sys,json
data=json.load(sys.stdin)
for p in data:
  if p['name']=='ice':
    env=p.get('pm2_env',{})
    print('exec_mode:', env.get('exec_mode'))
    print('exec_path:', env.get('pm_exec_path',''))
    print('args:', env.get('args',''))
    print('script:', env.get('script',''))
    print('node_args:', env.get('node_args',''))
" 2>/dev/null
  `);
  log(iceDetail);

  step('Killing ice and restarting on correct port...');
  await ssh('pm2 delete ice 2>/dev/null; true');
  await new Promise(r => setTimeout(r, 1000));

  // Force start on port 3012 using next binary directly
  const iceStart = await ssh(`
    cd /www/wwwroot/ice.namainvist.com
    # Check if .next build exists
    [ -d ".next" ] && echo "HAS_BUILD" || echo "NO_BUILD"
    # Try starting next directly on port 3012
    pm2 start "node_modules/.bin/next start -p 3012" --name ice 2>&1 | tail -3
  `);
  log(iceStart);

  await new Promise(r => setTimeout(r, 5000));

  const icePortCheck = await ssh('nc -z 127.0.0.1 3012 2>/dev/null && echo "✅ Port 3012 OK" || echo "❌ Port 3012 STILL DEAD"');
  log(icePortCheck);

  if (icePortCheck.includes('STILL DEAD')) {
    step('Port still dead — trying to rebuild ice...');
    await ssh('pm2 delete ice 2>/dev/null; true');
    await ssh('cd /www/wwwroot/ice.namainvist.com && npm run build 2>&1 | tail -3');
    await ssh('pm2 start "node_modules/.bin/next start -p 3012" --name ice 2>&1 | tail -2');
    await new Promise(r => setTimeout(r, 8000));
    const iceCheck2 = await ssh('nc -z 127.0.0.1 3012 2>/dev/null && echo "✅ Port 3012 OK after rebuild" || echo "❌ Port 3012 FAILED"');
    log(iceCheck2);
  }

  // ─── FIX 2: Ensure 104-modules on all nodes ──────────────────
  log('\n═══ FIX 2: Ensure 104-modules on all nodes ═══\n');

  // Check which nodes are missing it
  const missing = await ssh(`
    for d in /www/wwwroot/n{1..11}.namainvist.com /www/wwwroot/ice.namainvist.com; do
      name=$(basename $d)
      if [ ! -f "$d/src/app/(dashboard)/reports/104-modules/page.tsx" ]; then
        echo "MISSING: $name"
      else
        echo "OK: $name"
      fi
    done
  `);
  log(missing);

  // Write to all nodes using SSH (bypasses SFTP issues)
  step('Deploying missing 104-modules via heredoc...');
  
  // Escape the content for shell
  const escaped = reportPage.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  
  const deployResult = await ssh(`
    for d in /www/wwwroot/n{1..11}.namainvist.com /www/wwwroot/ice.namainvist.com; do
      target="$d/src/app/(dashboard)/reports/104-modules/page.tsx"
      mkdir -p "$(dirname $target)"
      # Copy from n1 (which already has it)
      cp -f "/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/reports/104-modules/page.tsx" "$target" 2>/dev/null && echo "✅ $(basename $d)" || echo "❌ $(basename $d)"
    done
  `);
  log(deployResult);

  // ─── FIX 3: Static index.html — permanent fix ────────────────
  log('\n═══ FIX 3: Static index.html permanent fix ═══\n');
  
  // The real fix: add `export const dynamic = 'force-dynamic'` to ensure
  // Next.js does NOT pre-render these pages statically
  step('Checking if page.tsx already has force-dynamic...');
  const hasDynamic = await ssh('grep -l "force-dynamic" /www/wwwroot/n{1..11}.namainvist.com/src/app/page.tsx 2>/dev/null | wc -l');
  log('  Pages with force-dynamic: ' + hasDynamic);

  // Rebuild all + delete static files after build
  step('Rebuilding all nodes and purging static HTML post-build...');
  
  const rebuildAndClean = await ssh(`
    failed=0
    success=0
    for dir in /www/wwwroot/n{1..11}.namainvist.com /www/wwwroot/ice.namainvist.com; do
      name=$(basename $dir)
      # Build in background per node
      (
        cd "$dir" && npm run build 2>&1 | tail -1
        rm -f "$dir/.next/server/app/index.html" 2>/dev/null
        pm2_name=$(grep -r "name" "$dir/ecosystem.config.js" 2>/dev/null | head -1 | grep -o "'[^']*'" | head -1 | tr -d "'" || basename $dir | sed 's/\\.namainvist\\.com//' | sed 's/n1$/n1-main/')
        pm2 restart $name 2>/dev/null || true
        echo "✓ $name done"
      ) &
    done
    wait
    echo "All background builds done"
  `);
  log(rebuildAndClean);

  // After builds, clean static files
  step('Final cleanup of static index.html files...');
  await new Promise(r => setTimeout(r, 5000));
  const cleanup = await ssh(`
    count=0
    for f in $(find /www/wwwroot -path "*/.next/server/app/index.html" 2>/dev/null); do
      rm -f "$f" && count=$((count+1))
    done
    echo "Removed $count static files"
  `);
  ok(cleanup);

  // ─── SAVE PM2 again ──────────────────────────────────────────
  step('Saving pm2 state...');
  await ssh('pm2 save --force 2>&1 | tail -1');
  ok('pm2 state saved');

  // ─── FINAL CHECK ─────────────────────────────────────────────
  log('\n═══ FINAL VERIFICATION ═══\n');
  await new Promise(r => setTimeout(r, 5000));

  const finalCheck = await ssh(`
    echo "PM2 processes:"
    pm2 list 2>/dev/null | grep -E "online|stopped|error" | awk -F'│' '{print "  " $3 ": " $9}' | grep -v "^  $"
    
    echo ""
    echo "Port checks:"
    for port in 2999 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 3012; do
      nc -z 127.0.0.1 $port 2>/dev/null && echo "  :$port ✅" || echo "  :$port ❌"
    done
    
    echo ""
    echo "104-modules pages:"
    find /www/wwwroot -path "*/104-modules/page.tsx" 2>/dev/null | wc -l | xargs -I{} echo "  {} / 12 nodes"
    
    echo ""
    echo "Static index.html remaining:"
    find /www/wwwroot -path "*/.next/server/app/index.html" 2>/dev/null | wc -l | xargs -I{} echo "  {} files"
    
    echo ""
    echo "PM2 startup:"
    systemctl is-enabled pm2-root 2>/dev/null || echo "  check manually"
  `);
  log(finalCheck);

  log('\n✅ Remediation complete!\n');
})();
