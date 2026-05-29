// upload-and-build-final.cjs — رفع الملفات المصلحة وبناء نهائي
'use strict';
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 };
const DIR = '/www/wwwroot/namainvist.com';
const LOCAL = path.resolve(__dirname, '..');

const FIXED_FILES = [
  'src/app/(dashboard)/manufacturing/orders/components/OrdersClient.tsx',
  'src/app/(dashboard)/manufacturing/boms/components/BomsClient.tsx',
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
function upload(sftp, l, r) { return new Promise((res, rej) => sftp.fastPut(l, r, e => e ? rej(e) : res())); }

const conn = new Client();
conn.on('ready', async () => {
  console.log('✅ Connected\n');
  const sftp = await getSftp(conn);

  for (const rel of FIXED_FILES) {
    const localPath = path.join(LOCAL, rel.replace(/\//g, path.sep));
    try {
      await upload(sftp, localPath, `${DIR}/${rel}`);
      console.log(`✅ Uploaded: ${rel}`);
    } catch(e) {
      console.error(`❌ ${rel}: ${e.message}`);
    }
  }

  // بناء
  console.log('\n🔨 Final build (12GB)...\n');
  await exec(conn, `cd ${DIR} && NODE_OPTIONS="--max-old-space-size=12288" npm run build 2>&1`, 420000);

  // Restart
  console.log('\n🔄 Restarting...');
  await exec(conn, 'pm2 restart all --update-env && sleep 10', 30000);
  await exec(conn, 'pm2 list', 10000);

  // Health
  console.log('\n🔍 Health:');
  for (const [p, d] of [[3000, 'namainvist.com'], [3001, 'n1'], [3500, 'n11']]) {
    const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 10000);
    console.log(`  ${c.trim() === '200' ? '✅' : '⚠️ '} ${d}: HTTP ${c.trim()}`);
  }

  conn.end();
  console.log('\n🏁 Done');
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect(SERVER);
