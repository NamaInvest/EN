// restart-staging-fresh.cjs
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
function exec(conn, cmd, to=20000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }

conn.on('ready', async () => {
  console.log('Restarting staging with fresh env...');

  // حذف وإعادة تشغيل
  await exec(conn, 'cd /www/wwwroot/namainvist.com && pm2 delete staging 2>/dev/null; sleep 2');
  await exec(conn, 'cd /www/wwwroot/namainvist.com && pm2 start ecosystem.config.js --only staging', 15000);
  await exec(conn, 'sleep 8');

  // تحقق من الـ DATABASE_URL الفعلي
  const env = await exec(conn, 'pm2 env 4 2>/dev/null | grep DATABASE');
  console.log('Current DB:', env);

  // اختبر الـ login API
  const body = JSON.stringify({ username: 'admin', password: 'admin7773' });
  const loginTest = await exec(conn,
    `curl -s -X POST http://localhost:3600/api/auth/login -H 'Content-Type: application/json' -d '${body}' | head -c 300`,
    10000
  );
  console.log('\nLogin API test:', loginTest);

  // pm2 list
  console.log('\nPM2 status:');
  console.log(await exec(conn, 'pm2 list | grep staging'));

  conn.end();
  console.log('\nDone');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 10000 });
