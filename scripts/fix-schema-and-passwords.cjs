// fix-schema-and-passwords.cjs
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
function exec(conn, cmd, to=120000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }

const PG = 'PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=RootPassNama123';
const DIR = '/www/wwwroot/namainvist.com';

conn.on('ready', async () => {
  console.log('Connected\n');

  // 1. prisma db push على n11_db لإضافة deletedAt
  console.log('1. Prisma db push on n11_db...');
  const push1 = await exec(conn,
    `cd ${DIR} && DATABASE_URL="postgresql://postgres:RootPassNama123@127.0.0.1:5432/n11_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss 2>&1 | tail -4`,
    90000
  );
  console.log(push1);

  // 2. prisma db push على staging_db أيضاً
  console.log('\n2. Prisma db push on staging_db...');
  const push2 = await exec(conn,
    `cd ${DIR} && DATABASE_URL="postgresql://staging_user:StagingPass2025@127.0.0.1:5432/staging_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss 2>&1 | tail -4`,
    90000
  );
  console.log(push2);

  // 3. توليد hash صحيح لـ O_O772040030 وتخزينه
  console.log('\n3. Generating correct bcrypt hash...');
  const hashScript = `
const b = require('./node_modules/bcryptjs');
b.hash('O_O772040030', 10).then(hash => {
  process.stdout.write(hash);
});
`;
  const hash = await exec(conn, `cd ${DIR} && node -e "${hashScript.replace(/\n/g, ' ')}" 2>/dev/null`, 15000);
  console.log('Hash generated:', hash.startsWith('$2') ? '✅ ' + hash.substring(0, 30) + '...' : '❌ ' + hash);

  if (hash.startsWith('$2')) {
    // تحديث hash في كلا الـ databases
    const escaped = hash.trim().replace(/'/g, "''");

    console.log('\n4. Updating passwords in both DBs...');
    const u1 = await exec(conn, `${PG} psql -U postgres -d n11_db -c "UPDATE users SET password_hash='${escaped}' WHERE username='admin';" 2>&1`);
    console.log('  n11_db:', u1.includes('UPDATE') ? '✅ Updated' : u1);

    const u2 = await exec(conn, `PGHOST=127.0.0.1 PGPASSWORD=StagingPass2025 psql -U staging_user -d staging_db -c "UPDATE users SET password_hash='${escaped}' WHERE username='admin';" 2>&1`);
    console.log('  staging_db:', u2.includes('UPDATE') ? '✅ Updated' : u2);
  }

  // 5. restart
  console.log('\n5. Restarting all processes...');
  await exec(conn, `cd ${DIR} && pm2 restart all --update-env && sleep 10`, 20000);

  // 6. اختبر login
  console.log('\n6. Final login tests:');
  const tests = [
    [3500, 'n11',     'n11.namainvist.com'],
    [3600, 'staging', 'staging.namainvist.com'],
  ];
  for (const [port, name, host] of tests) {
    const r = await exec(conn,
      `curl -s -X POST http://localhost:${port}/api/auth/login -H 'Content-Type: application/json' -H 'Host: ${host}' -d '{"username":"admin","password":"O_O772040030"}' | head -c 200`,
      12000
    );
    const ok = r.includes('token') || r.includes('"user"');
    console.log(`  ${ok ? '✅' : '❌'} ${name}: ${r.substring(0, 120)}`);
  }

  conn.end();
  console.log('\nDone');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 10000 });
