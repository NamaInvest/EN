// final-fix-and-build.cjs — رفع server-t.ts + إعادة البناء النهائي
'use strict';
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const DIR = '/www/wwwroot/namainvist.com';
const LOCAL = path.resolve(__dirname, '..');

// الملفات التي نحتاج التأكد من تحديثها
const CRITICAL_FILES = [
  'src/lib/server-t.ts',
  'src/lib/logger.ts',
  'src/lib/i18n.tsx',
  'src/lib/i18n.ts',
  'src/lib/prisma.ts',
  'src/lib/auth.ts',
  'src/middleware.ts',
];

function exec(conn, cmd, timeout = 420000) {
  return new Promise(resolve => {
    const t = setTimeout(() => { process.stdout.write('\n⏰ Timeout\n'); resolve('TIMEOUT'); }, timeout);
    conn.exec(cmd, (err, s) => {
      if (err) { clearTimeout(t); resolve('ERR:' + err.message); return; }
      let o = '';
      s.on('data', d => { process.stdout.write(d); o += d; });
      s.stderr.on('data', d => { process.stderr.write(d); o += d; });
      s.on('close', () => { clearTimeout(t); resolve(o); });
    });
  });
}

function getSftp(conn) { return new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s))); }
function upload(sftp, local, remote) { return new Promise((r, j) => sftp.fastPut(local, remote, e => e ? j(e) : r())); }

const conn = new Client();
conn.on('ready', async () => {
  console.log('✅ Connected\n');
  const sftp = await getSftp(conn);

  // 1. رفع الملفات الحساسة
  console.log('📤 Uploading critical files...');
  for (const rel of CRITICAL_FILES) {
    const localPath = path.join(LOCAL, rel.replace(/\//g, path.sep));
    if (!fs.existsSync(localPath)) { console.log(`  ⚠️  Skip (not found): ${rel}`); continue; }
    try {
      await upload(sftp, localPath, `${DIR}/${rel}`);
      console.log(`  ✅ ${rel}`);
    } catch(e) { console.error(`  ❌ ${rel}: ${e.message}`); }
  }

  // 2. فحص server-t.ts على السيرفر
  console.log('\n=== server-t.ts on server (first 20 lines) ===');
  await exec(conn, `head -20 ${DIR}/src/lib/server-t.ts`, 5000);

  // 3. بناء
  console.log('\n🔨 Building with 12GB heap...\n');
  const buildOut = await exec(conn, `cd ${DIR} && NODE_OPTIONS="--max-old-space-size=12288" npm run build 2>&1`, 420000);

  const success = buildOut.includes('✓ Compiled') || buildOut.includes('Route (app)') || buildOut.includes('Generating static pages');

  if (success) {
    console.log('\n✅ BUILD SUCCEEDED!\n');
  } else {
    console.log('\n❌ Build errors remain — check above');
    // استخرج أسطر الخطأ
    const errLines = buildOut.split('\n').filter(l => l.includes('Module not found') || l.includes('error') || l.includes('Cannot find') || l.includes('Failed to compile'));
    console.log('\n🔍 Key errors:');
    errLines.slice(0, 10).forEach(l => console.log('  ', l.trim()));
  }

  // 4. Restart
  console.log('\n🔄 Restarting PM2...');
  await exec(conn, 'pm2 restart all --update-env 2>&1 | tail -5', 20000);
  await exec(conn, 'sleep 8 && pm2 list', 15000);

  // 5. Health
  console.log('\n🔍 Health checks:');
  for (const [p, d] of [[3000, 'namainvist.com'], [3001, 'n1'], [3500, 'n11']]) {
    const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 10000);
    const icon = c.trim() === '200' ? '✅' : '⚠️ ';
    console.log(`  ${icon} ${d}: HTTP ${c.trim()}`);
  }

  conn.end();
  console.log('\n🏁 Done');
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect(SERVER);
