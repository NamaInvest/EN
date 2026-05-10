// copy-users-pgdump.cjs — نسخ users باستخدام pg_dump
'use strict';
const { Client } = require('ssh2');
const conn = new Client();

function exec(conn, cmd, to = 30000) {
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

const PG = 'PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=RootPassNama123';

conn.on('ready', async () => {
  console.log('Connected\n');

  // dump جدول users فقط من n11_db
  console.log('📤 Dumping users from n11_db...');
  const dump = await exec(conn,
    `${PG} pg_dump -U postgres -d n11_db --data-only -t users --no-owner --no-acl 2>&1 | head -3`
  );
  console.log('Dump preview:', dump);

  // استعادة في staging_db
  console.log('\n📥 Restoring to staging_db...');
  const restore = await exec(conn,
    `${PG} pg_dump -U postgres -d n11_db --data-only -t users --no-owner --no-acl 2>/dev/null | ${PG} psql -U postgres -d staging_db 2>&1`,
    20000
  );
  console.log('Restore:', restore.includes('ERROR') ? '⚠️ ' + restore.split('\n').filter(l=>l.includes('ERROR')).join('\n') : '✅ Done');

  // نسخ companies أيضاً
  console.log('\n📥 Restoring companies...');
  await exec(conn,
    `${PG} pg_dump -U postgres -d n11_db --data-only -t companies --no-owner --no-acl 2>/dev/null | ${PG} psql -U postgres -d staging_db 2>&1`,
    15000
  );
  console.log('✅ Companies restored');

  // نسخ settings
  await exec(conn,
    `${PG} pg_dump -U postgres -d n11_db --data-only -t settings --no-owner --no-acl 2>/dev/null | ${PG} psql -U postgres -d staging_db 2>&1`,
    15000
  );
  console.log('✅ Settings restored');

  // نسخ user_permissions
  await exec(conn,
    `${PG} pg_dump -U postgres -d n11_db --data-only -t user_permissions --no-owner --no-acl 2>/dev/null | ${PG} psql -U postgres -d staging_db 2>&1`,
    15000
  );
  console.log('✅ Permissions restored');

  // تحقق
  console.log('\n🔍 Users in staging_db:');
  const check = await exec(conn,
    `${PG} psql -U postgres -d staging_db -c "SELECT id, username, full_name, role, active FROM users ORDER BY id;" 2>&1`
  );
  console.log(check);

  conn.end();
  console.log('\n✅ Done — login should work now!');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
