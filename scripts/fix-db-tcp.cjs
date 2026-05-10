// fix-db-tcp.cjs — إصلاح الصلاحيات عبر TCP مباشرة
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

  // استخدام PGHOST=127.0.0.1 بدل socket
  const env = `PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres PGPASSWORD=RootPassNama123`;

  console.log('🔧 Granting permissions via TCP (-h 127.0.0.1)...');
  const grants = [
    `${env} psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE staging_db TO staging_user;" 2>&1`,
    `${env} psql -d staging_db -c "GRANT ALL ON SCHEMA public TO staging_user;" 2>&1`,
    `${env} psql -d staging_db -c "ALTER SCHEMA public OWNER TO staging_user;" 2>&1`,
    `${env} psql -d staging_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO staging_user;" 2>&1`,
    `${env} psql -d staging_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO staging_user;" 2>&1`,
    `${env} psql -d staging_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO staging_user;" 2>&1`,
  ];

  for (const cmd of grants) {
    const r = await exec(conn, cmd, 10000);
    const ok = r.includes('GRANT') || r.includes('ALTER');
    console.log(`  ${ok ? '✅' : '❌'} ${cmd.split('-c "')[1]?.split('"')[0]}`);
    if (!ok && !r.includes('GRANT')) console.log('     >', r.substring(0, 100));
  }

  // اختبار الاتصال
  console.log('\n🔍 Testing staging_user connection...');
  const test = await exec(conn,
    `PGHOST=127.0.0.1 PGPORT=5432 PGPASSWORD='StagingPass2025' psql -U staging_user -d staging_db -c "SELECT current_database(), current_user;" 2>&1`
  );
  const connOk = test.includes('staging_db');
  console.log(connOk ? '  ✅ Connection OK:\n' + test : '  ❌ ' + test);

  // Prisma db push
  console.log('\n🔧 Prisma db push on staging_db...');
  const prisma = await exec(conn,
    `cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://staging_user:StagingPass2025@127.0.0.1:5432/staging_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss 2>&1 | tail -6`,
    120000
  );
  console.log(prisma);
  const prismaOk = prisma.includes('Your database is now in sync') || prisma.includes('no pending');

  // تحديث ecosystem.config.js بـ 127.0.0.1 بدل localhost
  if (prismaOk) {
    console.log('\n⚙️  Updating ecosystem.config.js to use 127.0.0.1...');
    await exec(conn, `cd /www/wwwroot/namainvist.com && sed -i 's|postgresql://staging_user:StagingPass2025@localhost|postgresql://staging_user:StagingPass2025@127.0.0.1|g' ecosystem.config.js`);
    await exec(conn, 'cd /www/wwwroot/namainvist.com && pm2 restart staging --update-env && sleep 5');
    console.log('  ✅ Ecosystem updated + staging restarted');
  }

  // Health check
  console.log('\n🔍 Health:');
  for (const [p, d] of [[3000, 'main'], [3001, 'n1'], [3500, 'n11'], [3600, 'staging']]) {
    const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 8000);
    console.log(`  ${c.trim() === '200' ? '✅' : '⚠️ '} ${d}: HTTP ${c.trim()}`);
  }

  conn.end();
  console.log('\n🏁 Done');
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
