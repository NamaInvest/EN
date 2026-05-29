// fix-main-site-env.cjs — إصلاح متغيرات main-site على السيرفر
'use strict';
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 };
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

  // 1. إضافة NEXTAUTH_URL و APP_URL إلى .env
  console.log('=== Current .env URL vars ===');
  await exec(conn, `grep -i "NEXT_PUBLIC_APP_URL\\|NEXTAUTH_URL" ${DIR}/.env`);

  // تحقق هل الـ vars موجودة
  const hasAppUrl = await exec(conn, `grep -c "NEXT_PUBLIC_APP_URL" ${DIR}/.env || echo 0`);
  const hasNextAuthUrl = await exec(conn, `grep -c "NEXTAUTH_URL" ${DIR}/.env || echo 0`);

  if (parseInt(hasAppUrl.trim()) === 0) {
    console.log('\n➕ Adding NEXT_PUBLIC_APP_URL...');
    await exec(conn, `echo 'NEXT_PUBLIC_APP_URL=https://namainvist.com' >> ${DIR}/.env`);
  }

  if (parseInt(hasNextAuthUrl.trim()) === 0) {
    console.log('➕ Adding NEXTAUTH_URL...');
    await exec(conn, `echo 'NEXTAUTH_URL=https://namainvist.com' >> ${DIR}/.env`);
  }

  // 2. تحديث ecosystem.config.js لإضافة env_file للـ main-site
  console.log('\n=== Updating ecosystem.config.js ===');

  // قراءة الملف
  const ecosystemContent = await exec(conn, `cat ${DIR}/ecosystem.config.js`);

  // فحص هل يحتوي على env_file لـ main-site
  if (!ecosystemContent.includes("name: 'main-site'") ) {
    console.log('⚠️  main-site not found in ecosystem.config.js');
  } else {
    // إضافة NEXTAUTH_URL إلى env block لـ main-site
    const updated = ecosystemContent.replace(
      `name: 'main-site',`,
      `name: 'main-site', // main site`
    ).replace(
      `env: {\n        NODE_ENV: 'production',\n        PORT: 3000,\n      },\n      max_restarts: 10,`,
      `env: {\n        NODE_ENV: 'production',\n        PORT: 3000,\n        NEXTAUTH_URL: 'https://namainvist.com',\n        NEXT_PUBLIC_APP_URL: 'https://namainvist.com',\n      },\n      max_restarts: 10,`
    );

    if (updated !== ecosystemContent) {
      await exec(conn, `cat > ${DIR}/ecosystem.config.js << 'HEREDOC'\n${updated}\nHEREDOC`);
      console.log('✅ ecosystem.config.js updated');
    } else {
      console.log('ℹ️  No change needed in ecosystem.config.js (vars may already exist)');
    }
  }

  // 3. Restart main-site
  console.log('\n🔄 Restarting main-site...');
  await exec(conn, 'pm2 restart main-site --update-env && sleep 5', 15000);
  await exec(conn, 'pm2 list', 10000);

  // 4. Health check
  console.log('\n🔍 Health check main-site:');
  const health = await exec(conn, 'curl -s -L -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-redirs 3', 10000);
  console.log('HTTP Status:', health.trim());

  conn.end();
  console.log('\n✅ Done');
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect(SERVER);
