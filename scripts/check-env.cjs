// check-env.cjs — فحص وإصلاح .env على السيرفر
'use strict';
const { Client } = require('ssh2');
const conn = new Client();

function exec(conn, cmd, timeout = 10000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve('TIMEOUT'), timeout);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(t); resolve('ERR:' + err.message); return; }
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(t); resolve(out.trim()); });
    });
  });
}

conn.on('ready', async () => {
  const DIR = '/www/wwwroot/namainvist.com';

  // فحص متغيرات الـ .env المتعلقة بالـ Clerk والـ Domain
  console.log('=== Checking .env for Clerk/URL vars ===');
  const clerkVars = await exec(conn, `grep -iE "CLERK|NEXT_PUBLIC_APP_URL|NEXTAUTH_URL|REDIRECT" ${DIR}/.env | head -15`);
  console.log(clerkVars || '(none)');

  console.log('\n=== NEXT_PUBLIC_ vars ===');
  const nextPublic = await exec(conn, `grep "NEXT_PUBLIC" ${DIR}/.env | head -15`);
  console.log(nextPublic || '(none)');

  // فحص ecosystem.config.js للـ env vars
  console.log('\n=== ecosystem.config.js (main-site env) ===');
  const ecosystem = await exec(conn, `grep -A 20 "'main-site'" ${DIR}/ecosystem.config.js | head -25`);
  console.log(ecosystem || '(not found)');

  conn.end();
});

conn.on('error', e => console.error('Connection error:', e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
