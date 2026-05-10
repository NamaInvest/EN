// test-login-direct.cjs
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
function exec(conn, cmd, to=15000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }

const PG = 'PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=RootPassNama123';

conn.on('ready', async () => {
  console.log('Connected\n');

  // 1. تحقق من admin user في n11_db
  console.log('=== Admin user in n11_db ===');
  const user = await exec(conn,
    `${PG} psql -U postgres -d n11_db -Atc "SELECT id, username, LEFT(password_hash, 30) as hash_prefix FROM users WHERE username='admin';" 2>&1`
  );
  console.log(user);

  // 2. اختبر كلمة السر مباشرة من السيرفر
  console.log('\n=== Direct login test (main - port 3000) ===');
  const login = await exec(conn,
    `curl -s -c /tmp/cookies.txt -X POST 'http://localhost:3000/api/auth/login' \
      -H 'Content-Type: application/json' \
      -H 'Host: namainvist.com' \
      -H 'x-forwarded-host: namainvist.com' \
      -d '{"username":"admin","password":"O_O772040030"}' 2>&1 | head -c 400`,
    12000
  );
  console.log(login);

  // 3. اختبر staging
  console.log('\n=== Direct login test (staging - port 3600) ===');
  const login2 = await exec(conn,
    `curl -s -X POST 'http://localhost:3600/api/auth/login' \
      -H 'Content-Type: application/json' \
      -H 'Host: staging.namainvist.com' \
      -H 'x-forwarded-host: staging.namainvist.com' \
      -d '{"username":"admin","password":"admin7773"}' 2>&1 | head -c 400`,
    12000
  );
  console.log(login2);

  // 4. حدّث كلمة السر في staging لتطابق كلمة السر الأصلية
  console.log('\n=== Updating staging password to match n11_db ===');
  const hash = await exec(conn,
    `cd /www/wwwroot/namainvist.com && node -e "const b=require('./node_modules/bcryptjs');b.hash('O_O772040030',10).then(h=>{process.stdout.write(h);})" 2>/dev/null`,
    15000
  );
  if (hash.startsWith('$2')) {
    const escaped = hash.trim().replace(/'/g, "''");
    const update = await exec(conn,
      `${PG} psql -U postgres -d staging_db -c "UPDATE users SET password_hash='${escaped}';" 2>&1`,
      8000
    );
    console.log('Staging password updated:', update);
  }

  conn.end();
});
conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
