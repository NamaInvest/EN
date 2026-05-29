// copy-core-data.cjs — نسخ البيانات الأساسية بالترتيب الصحيح
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

// دالة نسخ جدول واحد
async function copyTable(conn, table) {
  const result = await exec(conn,
    `${PG} pg_dump -U postgres -d n11_db --data-only -t ${table} --disable-triggers --no-owner --no-acl 2>/dev/null | ${PG} psql -U postgres -d staging_db 2>&1`,
    20000
  );
  const errors = result.split('\n').filter(l => l.includes('ERROR') && !l.includes('already exists'));
  return errors.length === 0 ? '✅' : '⚠️  ' + errors[0]?.substring(0, 80);
}

conn.on('ready', async () => {
  console.log('Connected\n');

  // مسح بيانات staging_db القديمة وإعادة تفعيل الـ FK بعد النسخ
  console.log('🔧 Disabling FK constraints temporarily...');
  await exec(conn, `${PG} psql -U postgres -d staging_db -c "SET session_replication_role = replica;" 2>&1`);

  // الترتيب الصحيح للجداول (الأب قبل الابن)
  const tables = [
    'companies',
    'branches',
    'settings',
    'currencies',
    'cost_centers',
    'users',
    'user_permissions',
    'fiscal_periods',
    'number_sequences',
    'numbering_sequences',
  ];

  console.log('📦 Copying core tables...\n');
  for (const table of tables) {
    const status = await copyTable(conn, table);
    console.log(`  ${status} ${table}`);
  }

  // إعادة تفعيل الـ FK
  await exec(conn, `${PG} psql -U postgres -d staging_db -c "SET session_replication_role = DEFAULT;" 2>&1`);

  // تحقق من المستخدمين
  console.log('\n🔍 Users in staging_db:');
  const check = await exec(conn,
    `${PG} psql -U postgres -d staging_db -c "SELECT id, username, full_name, role, active FROM users ORDER BY id;" 2>&1`
  );
  console.log(check);

  conn.end();
  console.log('\n✅ Login should work now!');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 10000 });
