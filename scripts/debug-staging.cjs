// debug-staging.cjs
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
function exec(conn, cmd, to=15000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:'+e.message);return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }

conn.on('ready', async () => {
  // 1. ايش الـ DB URL الحالي للـ staging
  console.log('=== staging env vars ===');
  console.log(await exec(conn, 'pm2 env 4 2>/dev/null | grep -i "DATABASE\\|NEXTAUTH\\|PORT" | head -10'));

  // 2. شوف ecosystem.config.js — هل فيه 127.0.0.1؟
  console.log('\n=== ecosystem staging section ===');
  console.log(await exec(conn, 'grep -A 20 "staging" /www/wwwroot/namainvist.com/ecosystem.config.js | head -25'));

  // 3. اختبر الاتصال بـ staging_db
  console.log('\n=== DB connection test ===');
  console.log(await exec(conn, 'PGHOST=127.0.0.1 PGPASSWORD=StagingPass2025 psql -U staging_user -d staging_db -Atc "SELECT username, LEFT(password_hash,20) FROM users;" 2>&1'));

  // 4. logs الـ staging
  console.log('\n=== staging logs (last 20 lines) ===');
  console.log(await exec(conn, 'pm2 logs staging --lines 20 --nostream 2>&1 | tail -25'));

  conn.end();
});
conn.on('error', e=>console.error(e.message));
conn.connect({ host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:10000 });
