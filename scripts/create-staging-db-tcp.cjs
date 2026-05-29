// create-staging-db-tcp.cjs
'use strict';
const { Client } = require('ssh2');
const conn = new Client();

function exec(conn, cmd, to=60000) {
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

const PG = `PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=RootPassNama123 psql -U postgres`;

conn.on('ready', async () => {
  console.log('Connected\n');

  // قائمة قواعد البيانات
  const list = await exec(conn, `${PG} -Atc "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;" 2>&1`);
  console.log('Existing DBs:', list);

  // إنشاء user وDB
  console.log('\n1. Create staging_user...');
  const u = await exec(conn, `${PG} -c "CREATE USER staging_user WITH PASSWORD 'StagingPass2025';" 2>&1`);
  console.log('  ', u.includes('CREATE ROLE') ? '✅ Created' : u);

  console.log('2. Create staging_db...');
  const d = await exec(conn, `${PG} -c "CREATE DATABASE staging_db OWNER staging_user;" 2>&1`);
  console.log('  ', d.includes('CREATE DATABASE') ? '✅ Created' : d);

  console.log('3. Grant schema...');
  const g1 = await exec(conn, `${PG} -d staging_db -c "GRANT ALL ON SCHEMA public TO staging_user;" 2>&1`);
  const g2 = await exec(conn, `${PG} -d staging_db -c "ALTER SCHEMA public OWNER TO staging_user;" 2>&1`);
  console.log('  Schema:', g1.includes('GRANT') ? '✅' : g1);
  console.log('  Owner:', g2.includes('ALTER') ? '✅' : g2);

  // اختبار الاتصال
  console.log('\n4. Test connection as staging_user...');
  const test = await exec(conn, `PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD=StagingPass2025 psql -U staging_user -d staging_db -Atc "SELECT current_database();" 2>&1`);
  console.log('  Result:', test);

  // تشغيل prisma
  console.log('\n5. Prisma db push...');
  const prisma = await exec(conn,
    `cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://staging_user:StagingPass2025@127.0.0.1:5432/staging_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss 2>&1 | tail -6`,
    120000
  );
  console.log(prisma);
  const prismaOk = prisma.includes('Your database is now in sync') || prisma.includes('no schema changes');

  if (prismaOk) {
    // تحديث ecosystem.config.js بـ 127.0.0.1
    console.log('\n6. Updating ecosystem to use 127.0.0.1...');
    await exec(conn, `sed -i "s|postgresql://staging_user:StagingPass2025@localhost:5432|postgresql://staging_user:StagingPass2025@127.0.0.1:5432|g" /www/wwwroot/namainvist.com/ecosystem.config.js`);
    await exec(conn, `sed -i "s|postgresql://staging_user:StagingPass2025@127.0.0.1:5432|postgresql://staging_user:StagingPass2025@127.0.0.1:5432|g" /www/wwwroot/namainvist.com/ecosystem.config.js`);
    await exec(conn, 'cd /www/wwwroot/namainvist.com && pm2 restart staging --update-env && sleep 5', 20000);
    console.log('  ✅ staging restarted with correct DB');
  }

  // Health
  console.log('\n7. Health:');
  for (const [p, d] of [[3000,'main'], [3001,'n1'], [3500,'n11'], [3600,'staging']]) {
    const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 8000);
    console.log(`  ${c.trim()==='200'?'✅':'⚠️ '} ${d}: HTTP ${c.trim()}`);
  }

  conn.end();
  console.log('\nDone');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 10000 });
