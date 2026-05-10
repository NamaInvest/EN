// upload-dashboard-fix.cjs
'use strict';
const { Client } = require('ssh2');
const path = require('path');
const conn = new Client();
function exec(conn, cmd, to=180000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }
function getSftp(conn) { return new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s))); }
function upload(sftp, remotePath, localPath) { return new Promise((res, rej) => { sftp.fastPut(localPath, remotePath, (e) => e ? rej(e) : res()); }); }

const DIR = '/www/wwwroot/namainvist.com';

conn.on('ready', async () => {
  console.log('Connected\n');
  const sftp = await getSftp(conn);

  const file = 'src/app/(dashboard)/dashboard/page.tsx';
  console.log('📤 Uploading dashboard fix...');
  await upload(sftp, `${DIR}/${file}`, path.join(__dirname, '..', file));
  console.log('✅ Uploaded');

  console.log('\n🔨 Building...');
  const build = await exec(conn,
    `cd ${DIR} && NODE_OPTIONS="--max-old-space-size=8192" npm run build 2>&1 | tail -5`,
    180000
  );
  console.log(build);

  console.log('\n🔄 Restarting...');
  await exec(conn, `cd ${DIR} && pm2 restart all --update-env && sleep 8`, 20000);

  console.log('\n✅ Done — refresh staging.namainvist.com/dashboard');
  conn.end();
});
conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
