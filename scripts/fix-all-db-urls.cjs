// fix-all-db-urls.cjs — تغيير localhost إلى 127.0.0.1 في كل processes
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

function getSftp(conn) { return new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s))); }
function write(sftp, p, c) {
  return new Promise((res, rej) => {
    const s = sftp.createWriteStream(p);
    s.on('error', rej); s.on('close', res); s.end(Buffer.from(c, 'utf8'));
  });
}

const DIR = '/www/wwwroot/namainvist.com';

const ecosystem = `module.exports = {
  apps: [
    {
      name: 'main-site',
      cwd: '${DIR}',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://postgres:RootPassNama123@127.0.0.1:5432/n11_db?schema=public',
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
        DATABASE_URL: 'postgresql://postgres:RootPassNama123@127.0.0.1:5432/n1_db?schema=public',
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
        DATABASE_URL: 'postgresql://postgres:RootPassNama123@127.0.0.1:5432/n11_db?schema=public',
        NEXTAUTH_URL: 'https://n11.namainvist.com',
        NEXT_PUBLIC_APP_URL: 'https://n11.namainvist.com',
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: 'staging',
      cwd: '${DIR}',
      script: 'node_modules/.bin/next',
      args: 'start -p 3600',
      env: {
        NODE_ENV: 'production',
        PORT: 3600,
        DATABASE_URL: 'postgresql://staging_user:StagingPass2025@127.0.0.1:5432/staging_db?schema=public',
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

conn.on('ready', async () => {
  console.log('Connected\n');
  const sftp = await getSftp(conn);

  // 1. كتابة ecosystem.config.js الجديد
  await write(sftp, `${DIR}/ecosystem.config.js`, ecosystem);
  console.log('✅ ecosystem.config.js updated (all localhost → 127.0.0.1)');

  // 2. إعادة تشغيل كل الـ processes
  console.log('\n🔄 Restarting all processes...');
  await exec(conn, `cd ${DIR} && pm2 delete all 2>/dev/null; sleep 3`, 15000);
  await exec(conn, `cd ${DIR} && pm2 start ecosystem.config.js && sleep 10`, 30000);

  // 3. تحقق من الـ env
  console.log('\n📋 Verifying DB URLs:');
  for (const [id, name] of [[0,'main-site'], [1,'n1-main'], [2,'saas-app'], [3,'staging']]) {
    const url = await exec(conn, `pm2 env ${id} 2>/dev/null | grep DATABASE_URL | head -1`);
    const ok = url.includes('127.0.0.1');
    console.log(`  ${ok ? '✅' : '❌'} ${name}: ${url.substring(0, 70)}`);
  }

  // 4. اختبر login على كل port
  console.log('\n🔍 Testing login API:');
  for (const [port, name] of [[3000,'main'], [3500,'n11'], [3600,'staging']]) {
    const r = await exec(conn,
      `curl -s -X POST http://localhost:${port}/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}' | head -c 150`,
      10000
    );
    const ok = r.includes('token') || r.includes('sessionToken') || r.includes('user');
    console.log(`  ${ok ? '✅' : '⚠️ '} ${name} (${port}): ${r.substring(0, 100)}`);
  }

  // 5. health check
  console.log('\n📊 Health:');
  for (const [p, d] of [[3000,'main'], [3001,'n1'], [3500,'n11'], [3600,'staging']]) {
    const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 8000);
    console.log(`  ${c.trim()==='200'?'✅':'⚠️ '} ${d}: HTTP ${c.trim()}`);
  }

  conn.end();
  console.log('\n✅ Done — try logging in now');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
