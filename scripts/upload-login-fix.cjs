// upload-login-fix.cjs — رفع إصلاح login route وإعادة البناء
'use strict';
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
function exec(conn, cmd, to=120000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }
function getSftp(conn) { return new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s))); }
function writeFile(sftp, remotePath, localPath) {
  return new Promise((res, rej) => {
    sftp.fastPut(localPath, remotePath, (e) => e ? rej(e) : res());
  });
}

const DIR = '/www/wwwroot/namainvist.com';

conn.on('ready', async () => {
  console.log('Connected\n');
  const sftp = await getSftp(conn);

  // رفع ملف login route المصلح
  const localFile = path.join(__dirname, '..', 'src/app/api/auth/login/route.ts');
  const remoteFile = `${DIR}/src/app/api/auth/login/route.ts`;

  console.log('📤 Uploading fixed login route...');
  await writeFile(sftp, remoteFile, localFile);
  console.log('✅ Uploaded');

  // بناء سريع
  console.log('\n🔨 Building (this takes ~2-3 min)...');
  const build = await exec(conn,
    `cd ${DIR} && NODE_OPTIONS="--max-old-space-size=8192" npm run build 2>&1 | tail -8`,
    180000
  );
  console.log(build);

  const buildOk = build.includes('Route (app)') || build.includes('compiled') || build.includes('Compiled');

  if (buildOk) {
    console.log('\n✅ Build success — restarting...');
    await exec(conn, `cd ${DIR} && pm2 restart all --update-env && sleep 8`, 20000);

    // اختبر login
    console.log('\n🔍 Testing login...');
    for (const [port, user, pass] of [[3500,'admin','O_O772040030'], [3600,'admin','O_O772040030']]) {
      const r = await exec(conn,
        `curl -s -X POST http://localhost:${port}/api/auth/login -H 'Content-Type: application/json' -d '{"username":"${user}","password":"${pass}"}' | head -c 200`,
        10000
      );
      const ok = r.includes('token');
      console.log(`  ${ok ? '✅' : '⚠️ '} port ${port}: ${r.substring(0, 100)}`);
    }
  } else {
    console.log('⚠️  Build may have failed — check output above');
  }

  conn.end();
  console.log('\nDone');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 10000 });
