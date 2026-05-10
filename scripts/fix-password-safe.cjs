// fix-password-safe.cjs — استخدام SQL file لتجنب مشكلة $ في bcrypt hash
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
function exec(conn, cmd, to=20000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }
function getSftp(conn) { return new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s))); }
function write(sftp, p, c) { return new Promise((res, rej) => { const s = sftp.createWriteStream(p); s.on('error', rej); s.on('close', res); s.end(Buffer.from(c, 'utf8')); }); }

const PG = 'PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=RootPassNama123';
const DIR = '/www/wwwroot/namainvist.com';

conn.on('ready', async () => {
  console.log('Connected\n');
  const sftp = await getSftp(conn);

  // 1. توليد hash على السيرفر وكتابته في ملف
  console.log('1. Generating bcrypt hash on server...');
  await exec(conn,
    `cd ${DIR} && node -e "require('./node_modules/bcryptjs').hash('O_O772040030',10).then(h=>{require('fs').writeFileSync('/tmp/new_hash.txt',h);})" 2>/dev/null`,
    10000
  );
  const hash = await exec(conn, 'cat /tmp/new_hash.txt 2>&1');
  console.log('Hash:', hash.startsWith('$2') ? '✅ ' + hash.substring(0, 30) + '...' : '❌ FAILED: ' + hash);

  if (!hash.startsWith('$2')) {
    console.log('Cannot generate hash, aborting');
    conn.end();
    return;
  }

  // 2. كتابة SQL update في ملف (تجنب مشكلة $ في shell)
  const sql = `UPDATE users SET password_hash = '${hash.trim()}' WHERE username = 'admin';\nSELECT username, LEFT(password_hash, 20) as hash_prefix FROM users WHERE username = 'admin';\n`;
  await write(sftp, '/tmp/update_passwords.sql', sql);
  console.log('  SQL file written');

  // 3. تحديث n11_db
  console.log('\n2. Updating n11_db...');
  const r1 = await exec(conn, `${PG} psql -U postgres -d n11_db -f /tmp/update_passwords.sql 2>&1`);
  console.log('  ', r1.includes('UPDATE') ? '✅' : '⚠️', r1);

  // 4. تحديث staging_db
  console.log('\n3. Updating staging_db...');
  const r2 = await exec(conn, `PGHOST=127.0.0.1 PGPASSWORD=StagingPass2025 psql -U staging_user -d staging_db -f /tmp/update_passwords.sql 2>&1`);
  console.log('  ', r2.includes('UPDATE') ? '✅' : '⚠️', r2);

  // 5. اختبر bcrypt comparison مباشرة
  console.log('\n4. Testing bcrypt comparison directly...');
  const compareScript = `
const b = require('./node_modules/bcryptjs');
const fs = require('fs');
const hash = fs.readFileSync('/tmp/new_hash.txt', 'utf8').trim();
b.compare('O_O772040030', hash).then(ok => {
  console.log('bcrypt compare result:', ok ? 'MATCH ✅' : 'NO MATCH ❌');
});
`;
  await write(sftp, '/tmp/compare_test.js', compareScript);
  const cmp = await exec(conn, `cd ${DIR} && node /tmp/compare_test.js 2>&1`, 10000);
  console.log('  ', cmp);

  // 6. اختبر login API مباشرة
  console.log('\n5. Testing login API...');
  await exec(conn, 'sleep 2');
  const l1 = await exec(conn,
    `curl -s -X POST http://localhost:3500/api/auth/login -H 'Content-Type: application/json' -H 'Host: n11.namainvist.com' -d '{"username":"admin","password":"O_O772040030"}' | head -c 200`,
    12000
  );
  console.log('  n11:', l1.includes('token') ? '✅ Login OK!' : '❌ ' + l1.substring(0, 100));

  const l2 = await exec(conn,
    `curl -s -X POST http://localhost:3600/api/auth/login -H 'Content-Type: application/json' -H 'Host: staging.namainvist.com' -d '{"username":"admin","password":"O_O772040030"}' | head -c 200`,
    12000
  );
  console.log('  staging:', l2.includes('token') ? '✅ Login OK!' : '❌ ' + l2.substring(0, 100));

  conn.end();
  console.log('\nDone');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
