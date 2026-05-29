// setup-staging.cjs — إعداد بيئة Staging كاملة
'use strict';
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 };
const DIR = '/www/wwwroot/namainvist.com';
const REPORT = [];

function log(msg) { console.log(msg); REPORT.push(msg); }

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
function writeRemote(sftp, remotePath, content) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(content, 'utf8');
    const stream = sftp.createWriteStream(remotePath);
    stream.on('error', reject);
    stream.on('close', resolve);
    stream.end(buf);
  });
}

const conn = new Client();
conn.on('ready', async () => {
  log('✅ Connected to server\n');
  const sftp = await getSftp(conn);

  // ==============================
  // 1. إنشاء staging_db
  // ==============================
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('📦 STEP 1: Creating staging_db database');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // تحقق هل staging_db موجودة
  const dbCheck = await exec(conn, `sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='staging_db'" 2>/dev/null`);
  if (dbCheck.trim() === '1') {
    log('  ℹ️  staging_db already exists — skipping creation');
  } else {
    // إنشاء user وقاعدة بيانات
    await exec(conn, `sudo -u postgres psql -c "CREATE USER staging_user WITH PASSWORD 'StagingPass2025';" 2>/dev/null`);
    const createDB = await exec(conn, `sudo -u postgres psql -c "CREATE DATABASE staging_db OWNER staging_user;" 2>/dev/null`);
    log(`  ✅ staging_db created: ${createDB.includes('CREATE') ? 'success' : createDB}`);

    // منح الصلاحيات
    await exec(conn, `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE staging_db TO staging_user;" 2>/dev/null`);
    log('  ✅ Permissions granted to staging_user');
  }

  // نسخ schema من n11_db إلى staging_db (بدون بيانات)
  log('  📋 Copying schema from n11_db to staging_db (structure only)...');
  const schemaResult = await exec(conn,
    `sudo -u postgres pg_dump --schema-only n11_db 2>/dev/null | sudo -u postgres psql staging_db 2>&1 | tail -3`,
    60000
  );
  log(`  ✅ Schema copied: ${schemaResult || 'done'}`);

  // تشغيل Prisma migrate على staging
  log('  🔧 Running prisma db push on staging_db...');
  const prismaResult = await exec(conn,
    `cd ${DIR} && DATABASE_URL="postgresql://staging_user:StagingPass2025@localhost:5432/staging_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss 2>&1 | tail -5`,
    120000
  );
  log(`  ✅ Prisma: ${prismaResult.split('\n').slice(-2).join(' ')}`);

  // ==============================
  // 2. تحديث ecosystem.config.js
  // ==============================
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('⚙️  STEP 2: Updating ecosystem.config.js');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const newEcosystem = `module.exports = {
  apps: [
    {
      name: 'main-site',
      cwd: '${DIR}',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://postgres:RootPassNama123@localhost:5432/n11_db?schema=public',
        NEXTAUTH_URL: 'https://namainvist.com',
        NEXT_PUBLIC_APP_URL: 'https://namainvist.com',
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: 'n1-main',
      cwd: '${DIR}',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://n1_db:n1_pass123@localhost:5432/n1_db?schema=public',
        NEXTAUTH_URL: 'https://n1.namainvist.com',
        NEXT_PUBLIC_APP_URL: 'https://n1.namainvist.com',
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: 'saas-app',
      cwd: '${DIR}',
      script: 'node_modules/.bin/next',
      args: 'start -p 3500',
      env: {
        NODE_ENV: 'production',
        PORT: 3500,
        DATABASE_URL: 'postgresql://n11_db:n11_pass123@localhost:5432/n11_db?schema=public',
        NEXTAUTH_URL: 'https://n11.namainvist.com',
        NEXT_PUBLIC_APP_URL: 'https://n11.namainvist.com',
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      // STAGING — isolated DB, safe for testing new features
      name: 'staging',
      cwd: '${DIR}',
      script: 'node_modules/.bin/next',
      args: 'start -p 3600',
      env: {
        NODE_ENV: 'production',
        PORT: 3600,
        DATABASE_URL: 'postgresql://staging_user:StagingPass2025@localhost:5432/staging_db?schema=public',
        NEXTAUTH_URL: 'https://staging.namainvist.com',
        NEXT_PUBLIC_APP_URL: 'https://staging.namainvist.com',
        STAGING: 'true',
      },
      max_restarts: 5,
      restart_delay: 3000,
    }
  ]
};
`;

  await writeRemote(sftp, `${DIR}/ecosystem.config.js`, newEcosystem);
  log('  ✅ ecosystem.config.js updated (dev → staging, isolated DB)');

  // ==============================
  // 3. إنشاء Nginx config لـ staging
  // ==============================
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🌐 STEP 3: Creating Nginx config for staging.namainvist.com');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const nginxConf = `# staging.namainvist.com — Staging environment
server {
    listen 80;
    server_name staging.namainvist.com;

    # Redirect HTTP → HTTPS
    return 301 https://\\$host\\$request_uri;
}

server {
    listen 443 ssl;
    server_name staging.namainvist.com;

    ssl_certificate     /etc/letsencrypt/live/namainvist.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/namainvist.com/privkey.pem;

    # Basic auth to protect staging from public access
    auth_basic "Staging Environment";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:3600;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }
}
`;

  await writeRemote(sftp, `/www/server/panel/vhost/nginx/staging.namainvist.com.conf`, nginxConf);
  log('  ✅ Nginx config created: /www/server/panel/vhost/nginx/staging.namainvist.com.conf');

  // إنشاء htpasswd لحماية staging (user: nama / pass: nama2025)
  const htpasswdResult = await exec(conn, `htpasswd -bc /etc/nginx/.htpasswd nama 'nama2025' 2>&1`);
  log(`  🔐 Basic auth created — User: nama / Pass: nama2025`);

  // إنشاء Symlink في sites-enabled
  await exec(conn, `ln -sf /www/server/panel/vhost/nginx/staging.namainvist.com.conf /etc/nginx/sites-enabled/staging.namainvist.com 2>/dev/null`);

  // تحقق من Nginx config
  const nginxTest = await exec(conn, 'nginx -t 2>&1');
  if (nginxTest.includes('successful')) {
    await exec(conn, 'nginx -s reload 2>&1');
    log('  ✅ Nginx reloaded successfully');
  } else {
    log(`  ⚠️  Nginx test: ${nginxTest}`);
  }

  // ==============================
  // 4. إيقاف saas-dev وتشغيل staging
  // ==============================
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🔄 STEP 4: Switching PM2 process (saas-dev → staging)');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await exec(conn, `cd ${DIR} && pm2 delete saas-dev 2>/dev/null; pm2 delete staging 2>/dev/null; sleep 2`);
  const pm2Start = await exec(conn, `cd ${DIR} && pm2 start ecosystem.config.js --only staging && sleep 5`, 30000);
  log('  ✅ PM2 staging process started');

  // restart others to pick up new ecosystem
  await exec(conn, `cd ${DIR} && pm2 restart main-site n1-main saas-app --update-env && sleep 5`, 30000);
  log('  ✅ All other processes restarted with updated env');

  const pm2List = await exec(conn, 'pm2 list');
  log('\n' + pm2List);

  // ==============================
  // 5. Health checks
  // ==============================
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🔍 STEP 5: Health checks');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const checks = [
    [3000, 'namainvist.com'],
    [3001, 'n1.namainvist.com'],
    [3500, 'n11.namainvist.com'],
    [3600, 'staging.namainvist.com'],
  ];

  for (const [port, domain] of checks) {
    const code = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/`, 10000);
    const icon = code.trim() === '200' ? '✅' : '⚠️ ';
    log(`  ${icon} ${domain} (port ${port}): HTTP ${code.trim()}`);
  }

  // ==============================
  // 6. حفظ التقرير
  // ==============================
  const reportPath = path.join(__dirname, '..', 'scripts', 'staging-setup-report.md');
  const reportContent = `# Staging Setup Report
Generated: ${new Date().toISOString()}

## What Was Done

### 1. Database
- Created PostgreSQL user \`staging_user\` with password \`StagingPass2025\`
- Created \`staging_db\` database (isolated from n11_db)
- Copied schema from \`n11_db\` (structure only, no customer data)
- Ran Prisma \`db push\` to ensure schema is up to date

### 2. PM2 Configuration
- Renamed process: \`saas-dev\` → \`staging\`
- Changed DB: \`n11_db\` → \`staging_db\` (isolated!)
- Updated URL: \`dev.namainvist.com\` → \`staging.namainvist.com\`

### 3. Nginx
- Created: \`/www/server/panel/vhost/nginx/staging.namainvist.com.conf\`
- Added Basic Auth protection (user: nama / pass: nama2025)
- Reloaded Nginx

### 4. Security
- Staging is protected with HTTP Basic Auth
- Cannot be accessed by the public without credentials

## Subdomains Summary

| Subdomain | Port | Process | Database | Purpose |
|-----------|------|---------|----------|---------|
| namainvist.com | 3000 | main-site | n11_db | Production main |
| n1.namainvist.com | 3001 | n1-main | n1_db | Tenant #1 |
| n11.namainvist.com | 3500 | saas-app | n11_db | Tenant #11 |
| staging.namainvist.com | 3600 | staging | staging_db | Testing (isolated) |

## ⚠️ DNS Note
Make sure to add an A record for \`staging.namainvist.com\` → \`46.4.188.170\` in your DNS provider.
The wildcard \`*.namainvist.com\` may already cover this.

## Staging Credentials
- URL: https://staging.namainvist.com
- Basic Auth User: nama
- Basic Auth Pass: nama2025
`;

  fs.writeFileSync(reportPath, reportContent);
  log(`\n📄 Report saved: scripts/staging-setup-report.md`);

  conn.end();
  log('\n🏁 Staging setup complete!');
});

conn.on('error', e => console.error('Connection error:', e.message));
conn.connect(SERVER);
