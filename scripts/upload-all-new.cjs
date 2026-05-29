// upload-all-new.cjs — رفع جميع الملفات الجديدة للسيرفر + بناء + تشغيل
'use strict';
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 };
const REMOTE_DIR = '/www/wwwroot/namainvist.com';
const LOCAL_ROOT = path.resolve(__dirname, '..');

// المجلدات الجديدة التي لا توجد على السيرفر
const NEW_DIRS = [
  'src/lib/api',
  'src/lib/db',
  'src/lib/instrumentation',
];

// ملفات فردية مُحدَّثة جوهرياً
const INDIVIDUAL_FILES = [
  'src/lib/auth.ts',
  'src/lib/state-machine.ts',
  'src/lib/logger.ts',
  'src/lib/prisma.ts',
];

function getAllFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...getAllFiles(full));
    else if (!e.name.includes('.test.') && !e.name.includes('.spec.')) results.push(full);
  }
  return results;
}

function exec(conn, cmd, timeout = 300000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => { console.log('⏰ Timeout'); resolve('TIMEOUT'); }, timeout);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(t); resolve('ERROR: ' + err.message); return; }
      let out = '';
      stream.on('data', d => { process.stdout.write(d); out += d; });
      stream.stderr.on('data', d => { process.stderr.write(d); out += d; });
      stream.on('close', () => { clearTimeout(t); resolve(out); });
    });
  });
}

function getSftp(conn) {
  return new Promise((resolve, reject) => conn.sftp((err, s) => err ? reject(err) : resolve(s)));
}

function uploadFile(s, local, remote) {
  return new Promise((resolve, reject) => s.fastPut(local, remote, e => e ? reject(e) : resolve()));
}

async function main() {
  const conn = new Client();

  conn.on('ready', async () => {
    console.log('✅ Connected\n');

    // جمع كل الملفات
    const allFiles = [];
    for (const dir of NEW_DIRS) {
      const localDir = path.join(LOCAL_ROOT, dir.replace(/\//g, path.sep));
      const files = getAllFiles(localDir);
      allFiles.push(...files.map(f => ({ local: f, rel: f.replace(LOCAL_ROOT + path.sep, '').replace(/\\/g, '/') })));
    }
    for (const f of INDIVIDUAL_FILES) {
      const local = path.join(LOCAL_ROOT, f.replace(/\//g, path.sep));
      if (fs.existsSync(local)) allFiles.push({ local, rel: f });
    }

    console.log(`📦 Total files to upload: ${allFiles.length}\n`);

    // إنشاء المجلدات على السيرفر
    const remoteDirs = new Set(allFiles.map(f => path.dirname(f.rel).replace(/\\/g, '/')));
    for (const d of remoteDirs) {
      await exec(conn, `mkdir -p ${REMOTE_DIR}/${d}`, 5000);
    }
    console.log('✅ Directories created\n');

    // رفع الملفات
    const s = await getSftp(conn);
    let ok = 0, fail = 0;
    for (const { local, rel } of allFiles) {
      try {
        await uploadFile(s, local, `${REMOTE_DIR}/${rel}`);
        console.log(`  ✅ ${rel}`);
        ok++;
      } catch (e) {
        console.error(`  ❌ ${rel}: ${e.message}`);
        fail++;
      }
    }

    console.log(`\n📊 Upload: ${ok} ok, ${fail} failed\n`);

    // البناء على السيرفر
    console.log('🔨 Building on server (this takes ~3 min)...\n');
    await exec(conn, `cd ${REMOTE_DIR} && npm run build 2>&1`, 360000);

    // Restart
    console.log('\n🔄 Restarting PM2...');
    await exec(conn, 'pm2 restart all', 15000);
    await exec(conn, 'sleep 8 && pm2 list', 20000);

    // Health checks
    console.log('\n🔍 Health checks:');
    for (const port of [3000, 3001, 3500]) {
      const code = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/api/health`, 10000);
      const status = code.trim() === '200' ? '✅' : '⚠️ ';
      console.log(`  ${status} Port ${port}: HTTP ${code.trim()}`);
    }

    conn.end();
    console.log('\n🏁 Done');
  });

  conn.on('error', e => console.error('Connection error:', e.message));
  conn.connect(SERVER);
}

main().catch(console.error);
