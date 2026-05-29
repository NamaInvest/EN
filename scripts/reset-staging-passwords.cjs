// reset-staging-passwords.cjs — تغيير كلمة سر جميع المستخدمين في staging
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

const PG = 'PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=RootPassNama123';
const NEW_PASSWORD = 'admin7773';

conn.on('ready', async () => {
  console.log('Connected\n');

  // توليد hash لكلمة السر باستخدام bcrypt على السيرفر
  console.log(`🔐 Generating bcrypt hash for "${NEW_PASSWORD}"...`);
  const hash = await exec(conn,
    `node -e "const b=require('bcryptjs');b.hash('${NEW_PASSWORD}',10).then(h=>console.log(h))" 2>/dev/null || ` +
    `node -e "const b=require('bcrypt');b.hash('${NEW_PASSWORD}',10).then(h=>console.log(h))" 2>/dev/null`,
    15000
  );

  if (!hash || hash.startsWith('ERR') || !hash.startsWith('$2')) {
    console.log('⚠️  bcrypt not available via node, trying via app...');
    // استخدام الـ app نفسه
    const hash2 = await exec(conn,
      `cd /www/wwwroot/namainvist.com && node -e "const b=require('./node_modules/bcryptjs');b.hash('${NEW_PASSWORD}',10).then(h=>console.log(h))" 2>&1`,
      15000
    );
    console.log('Hash:', hash2?.substring(0, 30) + '...');

    if (hash2?.startsWith('$2')) {
      const escaped = hash2.trim().replace(/'/g, "''");
      const update = await exec(conn,
        `${PG} psql -U postgres -d staging_db -c "UPDATE users SET password_hash='${escaped}';" 2>&1`,
        10000
      );
      console.log('\n✅ Update result:', update);
    }
  } else {
    console.log('Hash:', hash.substring(0, 30) + '...');
    const escaped = hash.trim().replace(/'/g, "''");
    const update = await exec(conn,
      `${PG} psql -U postgres -d staging_db -c "UPDATE users SET password_hash='${escaped}';" 2>&1`,
      10000
    );
    console.log('\n✅ Update result:', update);
  }

  // تحقق
  const users = await exec(conn,
    `${PG} psql -U postgres -d staging_db -c "SELECT id, username, full_name, role FROM users ORDER BY id;" 2>&1`
  );
  console.log('\nUsers updated:\n' + users);

  conn.end();
  console.log(`\n🏁 Done — all passwords changed to: ${NEW_PASSWORD}`);
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 10000 });
