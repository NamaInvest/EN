// smart-sync.cjs — رفع الملفات المهمة فقط (بدون cache/graphify-out)
// ويبني على السيرفر في النهاية
'use strict';
const { Client } = require('ssh2');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 };
const REMOTE = '/www/wwwroot/namainvist.com';
const LOCAL  = path.resolve(__dirname, '..');

// الملفات المهمة للـ Production (بدون cache/graphify/tests)
const SKIP = ['graphify-out', 'node_modules', '.next', '.git', '__tests__', 'graphify-out', '.test.ts', '.spec.ts', '.bak'];

function md5(f) {
  try { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex'); } catch { return null; }
}

function walkLocal(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.some(s => e.name.includes(s))) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkLocal(full, results);
    else results.push(full);
  }
  return results;
}

function exec(conn, cmd, timeout = 60000) {
  return new Promise(resolve => {
    const t = setTimeout(() => resolve('TIMEOUT'), timeout);
    conn.exec(cmd, (err, s) => {
      if (err) { clearTimeout(t); resolve('ERR:' + err.message); return; }
      let o = '';
      s.on('data', d => o += d);
      s.stderr.on('data', d => o += d);
      s.on('close', () => { clearTimeout(t); resolve(o); });
    });
  });
}

function getSftp(conn) {
  return new Promise((resolve, reject) => conn.sftp((err, s) => err ? reject(err) : resolve(s)));
}

function upload(s, local, remote) {
  return new Promise((resolve, reject) => s.fastPut(local, remote, e => e ? reject(e) : resolve()));
}

async function main() {
  const conn = new Client();
  conn.on('ready', async () => {
    console.log('✅ Connected\n');

    // 1. جمع ملفات السيرفر (بدون graphify-out)
    console.log('📋 Scanning server files...');
    const serverRaw = await exec(conn,
      `find ${REMOTE}/src ${REMOTE}/prisma -type f 2>/dev/null | grep -v "graphify-out" | grep -v "node_modules" | grep -v ".next" | xargs -I{} sh -c 'echo "{}|$(md5sum {} 2>/dev/null | cut -d" " -f1)"'`,
      120000
    );

    const serverMap = new Map();
    for (const line of serverRaw.split('\n')) {
      const parts = line.split('|');
      if (parts.length < 2) continue;
      const fp = parts[0].trim();
      const md5sum = parts[1].trim();
      if (fp && md5sum && fp.startsWith(REMOTE)) {
        serverMap.set(fp.replace(REMOTE + '/', ''), md5sum);
      }
    }
    console.log(`   Server: ${serverMap.size} files\n`);

    // 2. جمع ملفات محلية
    const localFiles = [
      ...walkLocal(path.join(LOCAL, 'src')),
      ...walkLocal(path.join(LOCAL, 'prisma')),
    ];
    const localMap = new Map();
    for (const f of localFiles) {
      const rel = f.replace(LOCAL + path.sep, '').replace(/\\/g, '/');
      const h = md5(f);
      if (h) localMap.set(rel, { hash: h, local: f });
    }
    console.log(`   Local:  ${localMap.size} files\n`);

    // 3. مقارنة
    const toUpload = [];
    const onlyServer = [];
    let same = 0;

    for (const [rel, { hash, local: lf }] of localMap) {
      if (!serverMap.has(rel)) {
        toUpload.push({ rel, local: lf, reason: 'new' });
      } else if (serverMap.get(rel) !== hash) {
        toUpload.push({ rel, local: lf, reason: 'changed' });
      } else {
        same++;
      }
    }
    for (const rel of serverMap.keys()) {
      if (!localMap.has(rel)) onlyServer.push(rel);
    }

    console.log(`📊 DIFF RESULTS:`);
    console.log(`   ✅ Same:           ${same}`);
    console.log(`   🆕 New (upload):   ${toUpload.filter(f => f.reason === 'new').length}`);
    console.log(`   ✏️  Changed (upload): ${toUpload.filter(f => f.reason === 'changed').length}`);
    console.log(`   🖥️  Only server:    ${onlyServer.length}`);

    if (onlyServer.length) {
      console.log('\n🖥️  Files only on server (kept):');
      onlyServer.slice(0, 10).forEach(f => console.log('   S', f));
    }

    if (toUpload.length === 0) {
      console.log('\n✅ Everything is in sync!');
      conn.end(); return;
    }

    // 4. رفع الملفات
    console.log(`\n📤 Uploading ${toUpload.length} files...`);

    // إنشاء مجلدات
    const dirs = new Set(toUpload.map(f => path.dirname(f.rel)));
    for (const d of dirs) {
      await exec(conn, `mkdir -p ${REMOTE}/${d}`, 5000);
    }

    const s = await getSftp(conn);
    let ok = 0, fail = 0;

    for (const { rel, local: lf } of toUpload) {
      try {
        await upload(s, lf, `${REMOTE}/${rel}`);
        ok++;
        if (ok % 100 === 0) console.log(`   📤 ${ok}/${toUpload.length} uploaded...`);
      } catch(e) {
        fail++;
        if (fail <= 5) console.error(`  ❌ ${rel}: ${e.message}`);
      }
    }

    console.log(`\n✅ Upload: ${ok} ok, ${fail} failed`);

    // 5. بناء على السيرفر
    console.log('\n🔨 Building on server...');
    const buildOut = await exec(conn, `cd ${REMOTE} && npm run build 2>&1 | tail -10`, 360000);
    console.log(buildOut);

    // 6. Restart
    console.log('🔄 Restarting PM2...');
    await exec(conn, 'pm2 restart all --update-env && sleep 8', 30000);
    const list = await exec(conn, 'pm2 list', 10000);
    console.log(list);

    // 7. Health
    console.log('🔍 Health:');
    for (const [p, d] of [[3000, 'namainvist.com'], [3001, 'n1'], [3500, 'n11']]) {
      const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 10000);
      console.log(`  ${c.trim() === '200' ? '✅' : '⚠️ '} ${d}: ${c.trim()}`);
    }

    // 8. حفظ التقرير
    fs.writeFileSync(path.join(LOCAL, 'scripts', 'sync-report.json'), JSON.stringify({
      timestamp: new Date().toISOString(),
      same, uploaded: ok, failed: fail,
      only_server: onlyServer,
      new_files: toUpload.filter(f => f.reason === 'new').map(f => f.rel),
      changed_files: toUpload.filter(f => f.reason === 'changed').map(f => f.rel),
    }, null, 2));

    conn.end();
    console.log('\n🏁 Smart sync complete');
  });

  conn.on('error', e => console.error('Error:', e.message));
  conn.connect(SERVER);
}

main().catch(console.error);
