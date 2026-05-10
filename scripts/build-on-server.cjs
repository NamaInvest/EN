// build-on-server.cjs — بناء على السيرفر مع تحديد ذاكرة كافية
'use strict';
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const DIR = '/www/wwwroot/namainvist.com';

function exec(conn, cmd, timeout = 360000) {
  return new Promise(resolve => {
    const t = setTimeout(() => { console.log('⏰ Timeout'); resolve('TIMEOUT'); }, timeout);
    conn.exec(cmd, (err, s) => {
      if (err) { clearTimeout(t); resolve('ERR:' + err.message); return; }
      let o = '';
      s.on('data', d => { process.stdout.write(d); o += d; });
      s.stderr.on('data', d => { process.stderr.write(d); o += d; });
      s.on('close', () => { clearTimeout(t); resolve(o); });
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  console.log('✅ Connected\n');

  // فحص الذاكرة
  console.log('=== Memory ===');
  await exec(conn, 'free -m | head -2', 5000);

  // بناء مع 12GB heap limit (السيرفر عنده 60GB)
  console.log('\n🔨 Building with NODE_OPTIONS=--max-old-space-size=12288...');
  const build = await exec(conn,
    `cd ${DIR} && NODE_OPTIONS="--max-old-space-size=12288" npm run build 2>&1`,
    420000
  );

  if (build.includes('✓ Compiled') || build.includes('Route (app)')) {
    console.log('\n✅ Build succeeded!');

    // Restart
    console.log('\n🔄 Restarting PM2...');
    await exec(conn, 'pm2 restart all --update-env && sleep 8', 30000);
    await exec(conn, 'pm2 list', 10000);

    // Health
    console.log('\n🔍 Health checks:');
    for (const [p, d] of [[3000, 'namainvist.com'], [3001, 'n1'], [3500, 'n11']]) {
      const c = await exec(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${p}/`, 10000);
      console.log(`  ${c.trim() === '200' ? '✅' : '⚠️ '} ${d}: HTTP ${c.trim()}`);
    }
  } else if (build.includes('Build failed') || build.includes('OOM') || build.includes('out of memory')) {
    console.log('\n❌ Build failed — check output above');
  }

  conn.end();
  console.log('\n🏁 Done');
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect(SERVER);
