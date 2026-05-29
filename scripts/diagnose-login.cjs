// diagnose-login.cjs
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
function exec(conn, cmd, to=15000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }

const PG = 'PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=RootPassNama123';

conn.on('ready', async () => {
  // 1. PM2 error logs للـ n11
  console.log('=== n11 (saas-app) error logs ===');
  console.log(await exec(conn, 'pm2 logs saas-app --lines 15 --nostream --err 2>&1 | tail -20'));

  // 2. تحقق hash في staging_db
  console.log('\n=== Password hash in staging_db ===');
  const stageHash = await exec(conn, `${PG} psql -U postgres -d staging_db -Atc "SELECT username, password_hash FROM users WHERE username='admin';" 2>&1`);
  console.log(stageHash);

  // 3. تحقق hash في n11_db
  console.log('\n=== Password hash in n11_db ===');
  const n11Hash = await exec(conn, `${PG} psql -U postgres -d n11_db -Atc "SELECT username, password_hash FROM users WHERE username='admin';" 2>&1`);
  console.log(n11Hash);

  // 4. اختبر bcrypt مباشرة على السيرفر
  console.log('\n=== Bcrypt verify O_O772040030 ===');
  const bcryptTest = await exec(conn,
    `cd /www/wwwroot/namainvist.com && node -e "
      const b = require('./node_modules/bcryptjs');
      const hash = '${n11Hash.split('|')[1]?.trim()}';
      console.log('hash:', hash);
      b.compare('O_O772040030', hash).then(ok => console.log('match:', ok));
    " 2>&1`,
    10000
  );
  console.log(bcryptTest);

  // 5. اختبر login مباشرة بدون Host header
  console.log('\n=== Direct login on port 3500 (no tenant header) ===');
  const direct = await exec(conn,
    `curl -s -X POST http://localhost:3500/api/auth/login -H 'Content-Type: application/json' -H 'x-tenant: n11' -d '{"username":"admin","password":"O_O772040030"}' | head -c 300`,
    10000
  );
  console.log(direct);

  conn.end();
});
conn.on('error', e=>console.error(e.message));
conn.connect({ host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:10000 });
