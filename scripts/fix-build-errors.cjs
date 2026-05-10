// fix-build-errors.cjs — إصلاح أخطاء البناء وإعادة البناء
'use strict';
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const DIR = '/www/wwwroot/namainvist.com';
const LOCAL = path.resolve(__dirname, '..');

// الملفات التي فشل رفعها بسبب مجلدات components/ مفقودة
const MISSING_FILES = [
  'src/app/(dashboard)/products/components/ProductFormModal.tsx',
  'src/app/(dashboard)/manufacturing/boms/components/BomsClient.tsx',
  'src/app/(dashboard)/manufacturing/orders/components/OrdersClient.tsx',
];

function exec(conn, cmd, timeout = 360000) {
  return new Promise(resolve => {
    const t = setTimeout(() => { console.log('⏰ Timeout'); resolve('TIMEOUT'); }, timeout);
    conn.exec(cmd, (err, s) => {
      if (err) { clearTimeout(t); resolve('ERR:' + err.message); return; }
      let o = '';
      s.on('data', d => { process.stdout.write(d); o += d; });
      s.stderr.on('data', d => { process.stderr.write(d); o += d; });
      s.on('close', () => { clearTimeout(t); resolve(o); });
    });
  });
}

function getSftp(conn) {
  return new Promise((resolve, reject) => conn.sftp((err, s) => err ? reject(err) : resolve(s)));
}

function upload(sftp, local, remote) {
  return new Promise((resolve, reject) => sftp.fastPut(local, remote, e => e ? reject(e) : resolve()));
}

const conn = new Client();
conn.on('ready', async () => {
  console.log('✅ Connected\n');

  // 1. تثبيت @tanstack/react-table على السيرفر
  console.log('📦 Installing missing packages...');
  await exec(conn, `cd ${DIR} && npm install @tanstack/react-table --save 2>&1 | tail -5`, 120000);
  console.log('✅ Packages installed\n');

  // 2. إنشاء مجلدات components/ ورفع الملفات
  console.log('📤 Uploading missing component files...');
  const sftp = await getSftp(conn);

  for (const rel of MISSING_FILES) {
    const localPath = path.join(LOCAL, rel.replace(/\//g, path.sep));
    const remotePath = `${DIR}/${rel}`;
    const remoteDir = path.dirname(remotePath);

    // إنشاء المجلد
    await exec(conn, `mkdir -p "${remoteDir}"`, 5000);

    if (!fs.existsSync(localPath)) {
      console.log(`  ⚠️  Not found locally: ${rel}`);
      continue;
    }

    try {
      await upload(sftp, localPath, remotePath);
      console.log(`  ✅ Uploaded: ${rel}`);
    } catch(e) {
      console.error(`  ❌ Failed: ${rel}: ${e.message}`);
    }
  }

  // 3. بناء على السيرفر مع 12GB
  console.log('\n🔨 Building (12GB heap)...\n');
  await exec(conn, `cd ${DIR} && NODE_OPTIONS="--max-old-space-size=12288" npm run build 2>&1`, 420000);

  // 4. Restart
  console.log('\n🔄 Restarting PM2...');
  await exec(conn, 'pm2 restart all --update-env && sleep 10', 30000);
  await exec(conn, 'pm2 list', 10000);

  // 5. Health
  console.log('\n🔍 Health checks:');
  for (const [p, d] of [[3000, 'namainvist.com'], [3001, 'n1.namainvist.com'], [3500, 'n11.namainvist.com']]) {
    const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 10000);
    console.log(`  ${c.trim() === '200' ? '✅' : '⚠️ '} ${d}: HTTP ${c.trim()}`);
  }

  conn.end();
  console.log('\n🏁 Done');
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect(SERVER);
