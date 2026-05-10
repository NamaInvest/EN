// seed-staging-user.cjs — نسخ مستخدمين من n11_db إلى staging_db
'use strict';
const { Client } = require('ssh2');
const conn = new Client();

function exec(conn, cmd, to = 20000) {
  return new Promise(r => {
    const t = setTimeout(() => r('TIMEOUT'), to);
    conn.exec(cmd, (e, s) => {
      if (e) { clearTimeout(t); r('ERR:' + e.message); return; }
      let o = '';
      s.on('data', d => o += d);
      s.stderr.on('data', d => o += d);
      s.on('close', () => { clearTimeout(t); r(o.trim()); });
    });
  });
}

const PG_MAIN   = `PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=RootPassNama123 psql -U postgres`;
const PG_STAGE  = `PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=StagingPass2025 psql -U staging_user`;

conn.on('ready', async () => {
  console.log('✅ Connected\n');

  // عرض المستخدمين في n11_db
  console.log('👥 Users in n11_db:');
  const users = await exec(conn,
    `${PG_MAIN} -d n11_db -c "SELECT id, username, full_name, role, active FROM \\"User\\" ORDER BY id LIMIT 10;" 2>&1`
  );
  console.log(users);

  // نسخ جميع المستخدمين من n11_db إلى staging_db
  console.log('\n📋 Copying users to staging_db...');
  const copy = await exec(conn,
    `${PG_MAIN} -d n11_db -c "COPY \\"User\\" TO STDOUT" 2>&1 | ${PG_STAGE} -d staging_db -c "COPY \\"User\\" FROM STDIN" 2>&1`,
    15000
  );
  console.log('Copy result:', copy || '✅ Done');

  // إعادة تعيين sequence
  await exec(conn,
    `${PG_STAGE} -d staging_db -c "SELECT setval(pg_get_serial_sequence('\\\"User\\\"', 'id'), (SELECT MAX(id) FROM \\"User\\"));" 2>&1`
  );

  // تحقق
  console.log('\n✅ Users in staging_db now:');
  const verify = await exec(conn,
    `${PG_STAGE} -d staging_db -c "SELECT id, username, full_name, role, active FROM \\"User\\" ORDER BY id;" 2>&1`
  );
  console.log(verify);

  // نسخ الـ Company settings أيضاً (للاسم والشعار)
  console.log('\n📋 Copying Company settings...');
  const compCopy = await exec(conn,
    `${PG_MAIN} -d n11_db -c "COPY \\"Company\\" TO STDOUT" 2>&1 | ${PG_STAGE} -d staging_db -c "COPY \\"Company\\" FROM STDIN" 2>&1`,
    10000
  );
  console.log('Company:', compCopy || '✅');

  conn.end();
  console.log('\n🏁 Staging seeded — try logging in now');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
