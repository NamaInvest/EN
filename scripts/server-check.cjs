// server-check.cjs — فحص السيرفر وبناء المشروع عليه
'use strict';
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const REMOTE_DIR = '/www/wwwroot/namainvist.com';

function runCmd(conn, cmd, label, timeout = 300000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.log(`⏰ Timeout: ${label}`);
      resolve('TIMEOUT');
    }, timeout);

    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); console.error(`Error: ${err.message}`); resolve(''); return; }
      let out = '';
      stream.on('data', d => { process.stdout.write(d); out += d; });
      stream.stderr.on('data', d => { process.stderr.write(d); out += d; });
      stream.on('close', () => { clearTimeout(timer); resolve(out); });
    });
  });
}

async function main() {
  const conn = new Client();

  conn.on('ready', async () => {
    console.log('✅ Connected to server\n');

    // 1. فحص الوضع الحالي
    console.log('=== PM2 Status ===');
    await runCmd(conn, 'pm2 list', 'pm2 list', 10000);

    console.log('\n=== .next directory ===');
    await runCmd(conn, `ls -la ${REMOTE_DIR}/.next 2>&1 | head -8`, '.next check', 8000);

    console.log('\n=== Node & NPM version ===');
    await runCmd(conn, 'node --version && npm --version', 'versions', 8000);

    console.log('\n=== Free disk space ===');
    await runCmd(conn, 'df -h / | tail -1', 'disk', 5000);

    console.log('\n=== Free memory ===');
    await runCmd(conn, 'free -m | head -2', 'memory', 5000);

    console.log('\n=== Last git commits on server ===');
    await runCmd(conn, `cd ${REMOTE_DIR} && git log --oneline -5 2>&1`, 'git log', 10000);

    // 2. بناء على السيرفر
    console.log('\n\n🔨 Building on server (npm run build)...');
    await runCmd(conn, `cd ${REMOTE_DIR} && npm run build 2>&1`, 'npm build', 300000);

    // 3. restart
    console.log('\n🔄 Restarting PM2...');
    await runCmd(conn, 'pm2 restart all && sleep 5 && pm2 list', 'pm2 restart', 30000);

    // 4. health check
    console.log('\n🔍 Health check...');
    await runCmd(conn, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health', 'health', 15000);

    conn.end();
    console.log('\n✅ Done');
  });

  conn.on('error', (err) => { console.error('Connection error:', err.message); });
  conn.connect(SERVER);
}

main();
