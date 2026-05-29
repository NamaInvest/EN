// fix-db-permissions.cjs
'use strict';
const { Client } = require('ssh2');
const conn = new Client();

function exec(conn, cmd, timeout = 60000) {
  return new Promise(resolve => {
    const t = setTimeout(() => resolve('TIMEOUT'), timeout);
    conn.exec(cmd, (err, s) => {
      if (err) { clearTimeout(t); resolve('ERR:' + err.message); return; }
      let o = '';
      s.on('data', d => o += d);
      s.stderr.on('data', d => o += d);
      s.on('close', () => { clearTimeout(t); resolve(o.trim()); });
    });
  });
}

conn.on('ready', async () => {
  console.log('✅ Connected\n');

  // تحقق من port الـ postgres الصحيح
  const ports = await exec(conn, 'ss -tlnp | grep postgres');
  console.log('Active postgres ports:', ports);

  // استخدم psql مع port صريح 5432
  const cmds = [
    `psql -U postgres -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE staging_db TO staging_user;" 2>&1`,
    `psql -U postgres -p 5432 -d staging_db -c "GRANT ALL ON SCHEMA public TO staging_user;" 2>&1`,
    `psql -U postgres -p 5432 -d staging_db -c "ALTER SCHEMA public OWNER TO staging_user;" 2>&1`,
    `psql -U postgres -p 5432 -d staging_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO staging_user;" 2>&1`,
    `psql -U postgres -p 5432 -d staging_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO staging_user;" 2>&1`,
    `psql -U postgres -p 5432 -d staging_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO staging_user;" 2>&1`,
  ];

  for (const cmd of cmds) {
    const r = await exec(conn, cmd, 10000);
    const ok = r.includes('GRANT') || r.includes('ALTER');
    console.log(`  ${ok ? '✅' : '⚠️ '} ${cmd.split('-c "')[1]?.replace('" 2>&1', '')}`);
    if (!ok) console.log('    ', r);
  }

  // اختبار الاتصال بـ staging_db
  console.log('\n🔍 Testing staging_db connection...');
  const test = await exec(conn, `PGPASSWORD='StagingPass2025' psql -U staging_user -p 5432 -d staging_db -c "SELECT current_database(), current_user;" 2>&1`);
  console.log(test);

  // تشغيل prisma
  console.log('\n🔧 Prisma db push...');
  const prisma = await exec(conn,
    `cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://staging_user:StagingPass2025@localhost:5432/staging_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss 2>&1 | tail -6`,
    120000
  );
  console.log(prisma);

  // Nginx wildcard cert
  console.log('\n🌐 Checking Nginx for staging...');
  const nginxTest = await exec(conn, 'nginx -t 2>&1');
  console.log(nginxTest.includes('successful') ? '✅ Nginx OK' : nginxTest);

  // Health
  console.log('\n🔍 Health checks:');
  for (const [p, d] of [[3000, 'main'], [3001, 'n1'], [3500, 'n11'], [3600, 'staging']]) {
    const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 8000);
    console.log(`  ${c.trim() === '200' ? '✅' : '⚠️ '} ${d}: HTTP ${c.trim()}`);
  }

  conn.end();
  console.log('\n🏁 Done');
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 10000 });
