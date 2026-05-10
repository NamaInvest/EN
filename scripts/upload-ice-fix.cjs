// upload-ice-fix.cjs — رفع إصلاح ICE auth وإعادة البناء
'use strict';
const { Client } = require('ssh2');
const path = require('path');
const conn = new Client();
function exec(conn, cmd, to=180000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }
function getSftp(conn) { return new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s))); }
function upload(sftp, remotePath, localPath) { return new Promise((res, rej) => { sftp.fastPut(localPath, remotePath, (e) => e ? rej(e) : res()); }); }

const DIR = '/www/wwwroot/namainvist.com';
const files = [
  ['src/app/api/auth/login/route.ts',   'src/app/api/auth/login/route.ts'],
  ['src/app/api/ice/auth/route.ts',     'src/app/api/ice/auth/route.ts'],
];

conn.on('ready', async () => {
  console.log('Connected\n');
  const sftp = await getSftp(conn);

  console.log('📤 Uploading fixed files...');
  for (const [local, remote] of files) {
    await upload(sftp, `${DIR}/${remote}`, path.join(__dirname, '..', local));
    console.log('  ✅', remote);
  }

  console.log('\n🔨 Building...');
  const build = await exec(conn,
    `cd ${DIR} && NODE_OPTIONS="--max-old-space-size=8192" npm run build 2>&1 | tail -6`,
    180000
  );
  console.log(build);

  console.log('\n🔄 Restarting...');
  await exec(conn, `cd ${DIR} && pm2 restart all --update-env && sleep 10`, 20000);

  // اختبار ICE login
  console.log('\n🔍 Testing ICE login...');
  const ice = await exec(conn,
    `curl -s -X POST http://localhost:3000/api/ice/auth -H 'Content-Type: application/json' -H 'Host: namainvist.com' -d '{"username":"admin","password":"O_O772040030"}' | head -c 100`,
    10000
  );
  console.log('ICE:', ice.includes('"success":true') ? '✅ Login OK!' : ice.substring(0, 100));

  conn.end();
  console.log('\nDone');
});
conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
