// copy-users-to-staging.cjs
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

function getSftp(conn) { return new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s))); }
function write(sftp, p, c) {
  return new Promise((res, rej) => {
    const s = sftp.createWriteStream(p);
    s.on('error', rej); s.on('close', res); s.end(Buffer.from(c, 'utf8'));
  });
}

conn.on('ready', async () => {
  console.log('Connected\n');
  const sftp = await getSftp(conn);

  // 1. ابحث عن اسم جدول المستخدمين الحقيقي
  const tables = await exec(conn,
    `PGHOST=127.0.0.1 PGPASSWORD=RootPassNama123 psql -U postgres -d n11_db -Atc "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" 2>&1`
  );
  console.log('Tables in n11_db:\n' + tables + '\n');

  // 2. ابحث عن جدول User (قد يكون "users" أو "User")
  const userTable = tables.split('\n').find(t =>
    t.toLowerCase() === 'user' || t.toLowerCase() === 'users'
  ) || 'User';
  console.log('User table name:', userTable);

  // 3. اكتب SQL script ينسخ المستخدمين
  const sqlScript = `
\\c n11_db
\\copy "${userTable}" TO '/tmp/users_export.csv' WITH CSV HEADER;
\\c staging_db
\\copy "${userTable}" FROM '/tmp/users_export.csv' WITH CSV HEADER;
SELECT setval(pg_get_serial_sequence('"${userTable}"', 'id'), (SELECT MAX(id) FROM "${userTable}"));
SELECT id, username, full_name, role, active FROM "${userTable}" ORDER BY id;
`;
  await write(sftp, '/tmp/copy_users.sql', sqlScript);

  // 4. شغّل السكربت
  const result = await exec(conn,
    `PGHOST=127.0.0.1 PGPASSWORD=RootPassNama123 psql -U postgres -f /tmp/copy_users.sql 2>&1`,
    15000
  );
  console.log('Copy result:\n' + result);

  // 5. انسخ Company أيضاً
  const companyTable = tables.split('\n').find(t =>
    t.toLowerCase() === 'company' || t.toLowerCase() === 'companies'
  );

  if (companyTable) {
    const compSql = `
\\c n11_db
\\copy "${companyTable}" TO '/tmp/company_export.csv' WITH CSV HEADER;
\\c staging_db
\\copy "${companyTable}" FROM '/tmp/company_export.csv' WITH CSV HEADER;
`;
    await write(sftp, '/tmp/copy_company.sql', compSql);
    const compResult = await exec(conn,
      `PGHOST=127.0.0.1 PGPASSWORD=RootPassNama123 psql -U postgres -f /tmp/copy_company.sql 2>&1`,
      10000
    );
    console.log('\nCompany:', compResult.includes('COPY') ? '✅ Copied' : compResult);
  }

  // 6. تحقق نهائي
  console.log('\n✅ Final check — users in staging_db:');
  const check = await exec(conn,
    `PGHOST=127.0.0.1 PGPASSWORD=StagingPass2025 psql -U staging_user -d staging_db -Atc "SELECT username || ' | ' || role || ' | active=' || active FROM \\"${userTable}\\" ORDER BY id;" 2>&1`
  );
  console.log(check || 'No users found');

  conn.end();
  console.log('\nDone — try logging in now!');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
