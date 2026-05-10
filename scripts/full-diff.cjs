// full-diff.cjs — مقارنة شاملة بين الملفات المحلية والسيرفر
// يكتشف: ما هو موجود محلياً فقط، ما هو على السيرفر فقط، وما يختلف
'use strict';
const { Client } = require('ssh2');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const SERVER   = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const REMOTE   = '/www/wwwroot/namainvist.com';
const LOCAL    = path.resolve(__dirname, '..');

// المجلدات التي نريد مقارنتها
const COMPARE_DIRS = ['src', 'prisma', 'public', 'scripts'];

// استثناء
const IGNORE = ['.next', 'node_modules', '.git', '__tests__', '.test.', '.spec.', 'coverage'];

function md5File(filePath) {
  try {
    return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
  } catch { return null; }
}

function walkLocal(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.some(i => e.name.includes(i))) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkLocal(full, results);
    else results.push(full);
  }
  return results;
}

function exec(conn, cmd, timeout = 60000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve('TIMEOUT'), timeout);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(t); resolve('ERR:' + err.message); return; }
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(t); resolve(out); });
    });
  });
}

function sftp(conn) {
  return new Promise((resolve, reject) => conn.sftp((err, s) => err ? reject(err) : resolve(s)));
}

function uploadFile(s, local, remote) {
  return new Promise((resolve, reject) => s.fastPut(local, remote, (e) => e ? reject(e) : resolve()));
}

async function main() {
  const conn = new Client();

  conn.on('ready', async () => {
    console.log('✅ Connected\n');

    // 1. جمع ملفات السيرفر (find + md5sum)
    console.log('📋 Getting server file list...');
    const dirs = COMPARE_DIRS.map(d => `${REMOTE}/${d}`).join(' ');
    const serverRaw = await exec(conn,
      `find ${dirs} -type f 2>/dev/null | grep -v node_modules | grep -v ".next" | sort | xargs -I{} sh -c 'echo "{}|$(md5sum {} 2>/dev/null | cut -d\" \" -f1)"'`,
      120000
    );

    // 2. بناء map للملفات على السيرفر
    const serverMap = new Map(); // rel -> md5
    for (const line of serverRaw.split('\n')) {
      const [fp, md5] = line.split('|');
      if (fp && md5 && fp.startsWith(REMOTE)) {
        const rel = fp.replace(REMOTE + '/', '');
        serverMap.set(rel, md5.trim());
      }
    }
    console.log(`   Server: ${serverMap.size} files\n`);

    // 3. جمع ملفات محلية
    const localMap = new Map(); // rel -> md5
    for (const dir of COMPARE_DIRS) {
      const localDir = path.join(LOCAL, dir);
      const files = walkLocal(localDir);
      for (const f of files) {
        const rel = f.replace(LOCAL + path.sep, '').replace(/\\/g, '/');
        const md5 = md5File(f);
        if (md5) localMap.set(rel, md5);
      }
    }
    console.log(`   Local:  ${localMap.size} files\n`);

    // 4. مقارنة
    const onlyLocal  = []; // موجود محلياً فقط (جديد، يحتاج رفع)
    const onlyServer = []; // موجود على السيرفر فقط (ربما محذوف محلياً)
    const differs    = []; // موجود في الاثنين لكن يختلف

    for (const [rel, localMd5] of localMap) {
      if (!serverMap.has(rel)) {
        onlyLocal.push(rel);
      } else if (serverMap.get(rel) !== localMd5) {
        differs.push(rel);
      }
    }

    for (const rel of serverMap.keys()) {
      if (!localMap.has(rel)) {
        onlyServer.push(rel);
      }
    }

    // 5. تقرير
    console.log(`\n📊 DIFF REPORT:`);
    console.log(`   🆕 Only locally (need upload): ${onlyLocal.length}`);
    console.log(`   🖥️  Only on server (not local):  ${onlyServer.length}`);
    console.log(`   ✏️  Content differs:             ${differs.length}`);

    if (onlyLocal.length > 0) {
      console.log(`\n🆕 Files to upload (first 20):`);
      onlyLocal.slice(0, 20).forEach(f => console.log(`   + ${f}`));
      if (onlyLocal.length > 20) console.log(`   ... and ${onlyLocal.length - 20} more`);
    }

    if (onlyServer.length > 0) {
      console.log(`\n🖥️  Only on server (first 20):`);
      onlyServer.slice(0, 20).forEach(f => console.log(`   S ${f}`));
      if (onlyServer.length > 20) console.log(`   ... and ${onlyServer.length - 20} more`);
    }

    if (differs.length > 0) {
      console.log(`\n✏️  Content differs (first 20):`);
      differs.slice(0, 20).forEach(f => console.log(`   ~ ${f}`));
      if (differs.length > 20) console.log(`   ... and ${differs.length - 20} more`);
    }

    // 6. رفع الملفات الجديدة والمتغيرة تلقائياً
    const toUpload = [...onlyLocal, ...differs];
    if (toUpload.length === 0) {
      console.log('\n✅ All files are in sync!');
      conn.end();
      return;
    }

    console.log(`\n\n📤 Uploading ${toUpload.length} files...`);

    // إنشاء مجلدات
    const remoteDirs = new Set(toUpload.map(f => path.dirname(f)));
    for (const d of remoteDirs) {
      await exec(conn, `mkdir -p ${REMOTE}/${d}`, 5000);
    }

    const s = await sftp(conn);
    let ok = 0, fail = 0;

    for (const rel of toUpload) {
      const localPath  = path.join(LOCAL, rel.replace(/\//g, path.sep));
      const remotePath = `${REMOTE}/${rel}`;
      try {
        await uploadFile(s, localPath, remotePath);
        ok++;
        if (ok <= 30) console.log(`  ✅ ${rel}`);
      } catch(e) {
        console.error(`  ❌ ${rel}: ${e.message}`);
        fail++;
      }
    }

    if (ok > 30) console.log(`  ... and ${ok - 30} more uploaded`);
    console.log(`\n📊 Upload: ${ok} ok, ${fail} failed`);

    // 7. بناء على السيرفر إذا في تغييرات تستحق rebuild
    const needsBuild = toUpload.some(f =>
      f.includes('src/lib/') || f.includes('src/app/api/') ||
      f.startsWith('prisma/') || f.includes('src/middleware')
    );

    if (needsBuild) {
      console.log('\n🔨 Building on server...');
      const buildResult = await exec(conn, `cd ${REMOTE} && npm run build 2>&1 | tail -15`, 360000);
      console.log(buildResult);

      console.log('🔄 Restarting PM2...');
      await exec(conn, 'pm2 restart all && sleep 5', 20000);
    }

    // 8. Health check
    console.log('\n🔍 Final health checks:');
    for (const [port, domain] of [[3000, 'namainvist.com'], [3001, 'n1.namainvist.com'], [3500, 'n11.namainvist.com']]) {
      const code = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/`, 10000);
      const icon = code.trim() === '200' ? '✅' : '⚠️ ';
      console.log(`  ${icon} ${domain}: HTTP ${code.trim()}`);
    }

    // 9. حفظ التقرير
    const report = {
      timestamp: new Date().toISOString(),
      server_files: serverMap.size,
      local_files:  localMap.size,
      only_local:   onlyLocal,
      only_server:  onlyServer,
      differs:      differs,
      uploaded:     ok,
      upload_failed: fail,
    };
    fs.writeFileSync(path.join(LOCAL, 'scripts', 'sync-report.json'), JSON.stringify(report, null, 2));
    console.log('\n📄 Report saved: scripts/sync-report.json');

    conn.end();
    console.log('\n🏁 Sync complete');
  });

  conn.on('error', e => console.error('Connection error:', e.message));
  conn.connect(SERVER);
}

main().catch(console.error);
