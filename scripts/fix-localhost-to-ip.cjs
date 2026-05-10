// fix-localhost-to-ip.cjs — تغيير localhost إلى 127.0.0.1 في .env على السيرفر
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
function exec(conn, cmd, to=15000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }

conn.on('ready', async () => {
  const DIR = '/www/wwwroot/namainvist.com';

  // شوف الـ .env الحالي
  console.log('=== Current DATABASE_URL ===');
  console.log(await exec(conn, `grep DATABASE_URL ${DIR}/.env`));

  // استبدل localhost بـ 127.0.0.1 في .env
  console.log('\n🔧 Fixing localhost → 127.0.0.1 in .env...');
  await exec(conn, `sed -i 's|@localhost:5432|@127.0.0.1:5432|g' ${DIR}/.env`);

  console.log('=== New DATABASE_URL ===');
  console.log(await exec(conn, `grep DATABASE_URL ${DIR}/.env`));

  // أعد تشغيل جميع الـ processes
  console.log('\n🔄 Restarting all PM2 processes...');
  await exec(conn, `cd ${DIR} && pm2 restart all --update-env && sleep 8`, 25000);

  // اختبر الـ login على staging
  console.log('\n🔍 Testing login API on staging (port 3600)...');
  const loginTest = await exec(conn,
    `curl -s -X POST http://localhost:3600/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}' | head -c 300`,
    10000
  );
  console.log('Login result:', loginTest);

  // اختبر الـ main site أيضاً
  console.log('\n🔍 Testing login API on main site (port 3000)...');
  const mainTest = await exec(conn,
    `curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}' | head -c 300`,
    10000
  );
  console.log('Main result:', mainTest);

  // health checks
  console.log('\n📊 Health:');
  for (const [p, d] of [[3000,'main'], [3001,'n1'], [3500,'n11'], [3600,'staging']]) {
    const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 8000);
    console.log(`  ${c.trim()==='200'?'✅':'⚠️ '} ${d}: HTTP ${c.trim()}`);
  }

  conn.end();
  console.log('\n✅ Done');
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
