// upload-missing-files.cjs — رفع الملفات المفقودة من السيرفر
'use strict';
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 };
const REMOTE_DIR = '/www/wwwroot/namainvist.com';
const LOCAL_ROOT = path.resolve(__dirname, '..');

// الملفات الجديدة التي يحتاجها السيرفر
const MISSING_FILES = [
  'src/lib/api/api-key-auth.ts',
  'src/lib/api/idempotency.ts',
  'src/lib/api/rate-limit.ts',
  'src/lib/api/validate-request.ts',
  'src/lib/api/versioning.ts',
  'src/lib/api/with-cron.ts',
  'src/lib/api/with-route.ts',
  'src/lib/db/transaction.ts',
  'src/lib/auth.ts',
  'src/lib/state-machine.ts',
];

function exec(conn, cmd, timeout = 30000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve('TIMEOUT'), timeout);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(t); resolve('ERROR: ' + err.message); return; }
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(t); resolve(out.trim()); });
    });
  });
}

function sftp(conn) {
  return new Promise((resolve, reject) => conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp)));
}

function mkdirRemote(sftpClient, dirPath) {
  return new Promise((resolve) => {
    sftpClient.mkdir(dirPath, (err) => resolve(!err)); // ignore already-exists
  });
}

function uploadFile(sftpClient, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftpClient.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function main() {
  const conn = new Client();

  conn.on('ready', async () => {
    console.log('✅ Connected\n');
    const sftpClient = await sftp(conn);

    // إنشاء المجلدات المفقودة
    console.log('📁 Creating directories...');
    await exec(conn, `mkdir -p ${REMOTE_DIR}/src/lib/api ${REMOTE_DIR}/src/lib/db`);
    console.log('   ✅ Directories created');

    // رفع الملفات
    let uploaded = 0;
    let errors = 0;
    for (const rel of MISSING_FILES) {
      const localPath  = path.join(LOCAL_ROOT, rel.replace(/\//g, path.sep));
      const remotePath = `${REMOTE_DIR}/${rel}`;

      if (!fs.existsSync(localPath)) {
        console.log(`  ⚠️  Not found locally: ${rel}`);
        continue;
      }

      try {
        await uploadFile(sftpClient, localPath, remotePath);
        console.log(`  ✅ Uploaded: ${rel}`);
        uploaded++;
      } catch (e) {
        console.error(`  ❌ Failed: ${rel} — ${e.message}`);
        errors++;
      }
    }

    console.log(`\n📊 Upload: ${uploaded} ok, ${errors} errors`);

    // بناء على السيرفر
    console.log('\n🔨 Building on server...');
    const buildOut = await exec(conn, `cd ${REMOTE_DIR} && npm run build 2>&1 | tail -20`, 300000);
    console.log(buildOut);

    // Restart
    console.log('\n🔄 Restarting PM2...');
    const restartOut = await exec(conn, 'pm2 restart all && sleep 5 && pm2 list', 30000);
    console.log(restartOut);

    // Health check
    console.log('\n🔍 Health check port 3000...');
    const health = await exec(conn, 'sleep 8 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health', 20000);
    console.log('HTTP Status:', health || 'no response');

    console.log('\n🔍 Health check port 3001 (n1)...');
    const health2 = await exec(conn, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health', 10000);
    console.log('HTTP Status:', health2 || 'no response');

    conn.end();
  });

  conn.on('error', (err) => console.error('Connection error:', err.message));
  conn.connect(SERVER);
}

main().catch(console.error);
