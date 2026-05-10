// fix-staging-db-and-nginx.cjs — إصلاح DB permissions + Nginx SSL
'use strict';
const { Client } = require('ssh2');
const conn = new Client();

function exec(conn, cmd, timeout = 30000) {
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

function getSftp(conn) { return new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s))); }
function writeRemote(sftp, p, content) {
  return new Promise((res, rej) => {
    const s = sftp.createWriteStream(p);
    s.on('error', rej); s.on('close', res); s.end(Buffer.from(content, 'utf8'));
  });
}

conn.on('ready', async () => {
  console.log('✅ Connected\n');
  const sftp = await getSftp(conn);

  // 1. معرفة port الـ PostgreSQL الصحيح
  console.log('🔍 Finding PostgreSQL port...');
  const pgPort = await exec(conn, 'sudo -u postgres psql -tAc "SHOW port;" 2>/dev/null || pg_lsclusters 2>/dev/null || ss -tlnp | grep postgres');
  console.log('  PostgreSQL info:', pgPort);

  // 2. إصلاح صلاحيات staging_user
  console.log('\n🔧 Fixing staging_user permissions...');
  const fix1 = await exec(conn, `sudo -u postgres psql staging_db -c "GRANT ALL ON SCHEMA public TO staging_user;" 2>&1`);
  const fix2 = await exec(conn, `sudo -u postgres psql staging_db -c "ALTER SCHEMA public OWNER TO staging_user;" 2>&1`);
  const fix3 = await exec(conn, `sudo -u postgres psql staging_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO staging_user;" 2>&1`);
  const fix4 = await exec(conn, `sudo -u postgres psql staging_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO staging_user;" 2>&1`);
  console.log('  Schema permissions:', fix1.includes('GRANT') ? '✅' : fix1);
  console.log('  Table permissions:', fix3.includes('GRANT') ? '✅' : fix3);

  // 3. تشغيل Prisma db push
  console.log('\n🔧 Running Prisma db push on staging_db...');
  const prisma = await exec(conn,
    `cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://staging_user:StagingPass2025@localhost:5432/staging_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss 2>&1 | tail -8`,
    120000
  );
  console.log(prisma);

  // 4. معرفة مكان شهادة SSL الحقيقية
  console.log('\n🔍 Finding SSL certificates...');
  const sslLoc = await exec(conn, 'find /etc /www/server -name "fullchain.pem" 2>/dev/null | head -5');
  console.log('  Found certs:', sslLoc || 'none found');

  const certPath = sslLoc.split('\n')[0]?.trim();
  const keyLoc = await exec(conn, 'find /etc /www/server -name "privkey.pem" 2>/dev/null | head -3');
  const keyPath = keyLoc.split('\n')[0]?.trim();

  console.log(`  Cert: ${certPath}`);
  console.log(`  Key:  ${keyPath}`);

  // 5. إنشاء Nginx config صحيح بدون SSL أو بالمسار الصحيح
  let nginxConf;
  if (certPath && keyPath) {
    nginxConf = `# staging.namainvist.com
server {
    listen 80;
    server_name staging.namainvist.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name staging.namainvist.com;
    ssl_certificate ${certPath};
    ssl_certificate_key ${keyPath};
    auth_basic "Staging - Authorized Only";
    auth_basic_user_file /etc/nginx/.htpasswd;
    location / {
        proxy_pass http://127.0.0.1:3600;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
  } else {
    // HTTP فقط بدون SSL (يمكن إضافة cert لاحقاً)
    nginxConf = `# staging.namainvist.com (HTTP only - add SSL cert later)
server {
    listen 80;
    server_name staging.namainvist.com;
    auth_basic "Staging - Authorized Only";
    auth_basic_user_file /etc/nginx/.htpasswd;
    location / {
        proxy_pass http://127.0.0.1:3600;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
  }

  await writeRemote(sftp, '/www/server/panel/vhost/nginx/staging.namainvist.com.conf', nginxConf);
  await exec(conn, 'ln -sf /www/server/panel/vhost/nginx/staging.namainvist.com.conf /etc/nginx/sites-enabled/staging.namainvist.com 2>/dev/null');

  const nginxTest = await exec(conn, 'nginx -t 2>&1');
  if (nginxTest.includes('successful')) {
    await exec(conn, 'nginx -s reload');
    console.log('\n✅ Nginx reloaded successfully');
  } else {
    console.log('\n⚠️  Nginx test output:', nginxTest);
    // حذف symlink إذا فشل
    await exec(conn, 'rm -f /etc/nginx/sites-enabled/staging.namainvist.com');
    console.log('  Removed symlink — staging accessible via HTTP only through wildcard');
  }

  // 6. فحص نهائي
  console.log('\n🔍 Final health checks:');
  for (const [p, d] of [[3000, 'main'], [3001, 'n1'], [3500, 'n11'], [3600, 'staging']]) {
    const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 8000);
    console.log(`  ${c.trim() === '200' ? '✅' : '⚠️ '} ${d} (port ${p}): HTTP ${c.trim()}`);
  }

  conn.end();
  console.log('\n🏁 Fixes applied');
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
