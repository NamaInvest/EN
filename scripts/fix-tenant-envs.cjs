// fix-tenant-envs.cjs — إصلاح متغيرات n1 و n11 لتجنب redirect إلى localhost
'use strict';
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const DIR = '/www/wwwroot/namainvist.com';

function exec(conn, cmd, timeout = 30000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve('TIMEOUT'), timeout);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(t); resolve('ERR:' + err.message); return; }
      let out = '';
      stream.on('data', d => { process.stdout.write(d); out += d; });
      stream.stderr.on('data', d => { process.stderr.write(d); out += d; });
      stream.on('close', () => { clearTimeout(t); resolve(out); });
    });
  });
}

const conn = new Client();

conn.on('ready', async () => {
  console.log('✅ Connected\n');

  // فحص ملف n1.env
  console.log('=== /www/wwwroot/envs/n1.env ===');
  await exec(conn, 'cat /www/wwwroot/envs/n1.env 2>&1 | head -20');

  // فحص هل n11 لديه env_file
  console.log('\n=== ecosystem.config.js (n11/saas-app env) ===');
  await exec(conn, `grep -A 15 "'saas-app'" ${DIR}/ecosystem.config.js`);

  // إضافة NEXTAUTH_URL لـ n1.env إذا مفقود
  const n1EnvContent = await exec(conn, 'cat /www/wwwroot/envs/n1.env 2>&1');
  if (!n1EnvContent.includes('NEXTAUTH_URL') && !n1EnvContent.includes('ERR:')) {
    console.log('\n➕ Adding NEXTAUTH_URL to n1.env...');
    await exec(conn, "echo 'NEXTAUTH_URL=https://n1.namainvist.com' >> /www/wwwroot/envs/n1.env");
    await exec(conn, "echo 'NEXT_PUBLIC_APP_URL=https://n1.namainvist.com' >> /www/wwwroot/envs/n1.env");
    console.log('✅ Done');
  }

  // قراءة ecosystem.config.js وتحديث saas-app و saas-dev
  const ecosystem = await exec(conn, `cat ${DIR}/ecosystem.config.js`);

  let updated = ecosystem;

  // إضافة NEXTAUTH_URL لـ saas-app (n11)
  if (!ecosystem.includes("'saas-app'") || ecosystem.includes("'saas-app'")) {
    updated = updated
      .replace(
        `name: 'saas-app',\n      cwd: '/www/wwwroot/namainvist.com',  // ← SAME codebase!\n      script: 'node_modules/.bin/next',\n      args: 'start -p 3500',\n      env: {\n        NODE_ENV: 'production',\n        PORT: 3500,\n        DATABASE_URL: 'postgresql://n11_db:n11_pass123@localhost:5432/n11_db?schema=public',\n      },`,
        `name: 'saas-app',\n      cwd: '/www/wwwroot/namainvist.com',  // ← SAME codebase!\n      script: 'node_modules/.bin/next',\n      args: 'start -p 3500',\n      env: {\n        NODE_ENV: 'production',\n        PORT: 3500,\n        DATABASE_URL: 'postgresql://n11_db:n11_pass123@localhost:5432/n11_db?schema=public',\n        NEXTAUTH_URL: 'https://n11.namainvist.com',\n        NEXT_PUBLIC_APP_URL: 'https://n11.namainvist.com',\n      },`
      )
      .replace(
        `name: 'saas-dev',\n      cwd: '/www/wwwroot/namainvist.com',  // ← SAME codebase!\n      script: 'node_modules/.bin/next',\n      args: 'start -p 3600',\n      env: {\n        NODE_ENV: 'production',\n        PORT: 3600,\n        DATABASE_URL: 'postgresql://n11_db:n11_pass123@localhost:5432/n11_db?schema=public',\n      },`,
        `name: 'saas-dev',\n      cwd: '/www/wwwroot/namainvist.com',  // ← SAME codebase!\n      script: 'node_modules/.bin/next',\n      args: 'start -p 3600',\n      env: {\n        NODE_ENV: 'production',\n        PORT: 3600,\n        DATABASE_URL: 'postgresql://n11_db:n11_pass123@localhost:5432/n11_db?schema=public',\n        NEXTAUTH_URL: 'https://dev.namainvist.com',\n        NEXT_PUBLIC_APP_URL: 'https://dev.namainvist.com',\n      },`
      );
  }

  if (updated !== ecosystem) {
    // كتابة الملف المحدث
    const escaped = updated.replace(/'/g, "'\\''");
    await exec(conn, `cat > ${DIR}/ecosystem.config.js << 'NAMAEOF'\n${updated}\nNAMAEOF`, 10000);
    console.log('\n✅ ecosystem.config.js updated with tenant URLs');
  } else {
    console.log('\nℹ️  ecosystem.config.js already up to date');
  }

  // Restart all with updated env
  console.log('\n🔄 Restarting all PM2 with --update-env...');
  await exec(conn, `cd ${DIR} && pm2 restart ecosystem.config.js --update-env && sleep 8 && pm2 list`, 60000);

  // Health checks
  console.log('\n🔍 Health checks:');
  for (const [port, domain] of [[3000, 'namainvist.com'], [3001, 'n1.namainvist.com'], [3500, 'n11.namainvist.com']]) {
    const code = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/`, 10000);
    console.log(`  Port ${port} (${domain}): HTTP ${code.trim()}`);
  }

  conn.end();
  console.log('\n✅ Done');
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect(SERVER);
