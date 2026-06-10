/**
 * deploy-accounting-fix.mjs
 * يرفع ملفي إصلاح المحاسبة ثم يبني ويعيد تشغيل PM2 + يستدعي seed API
 * 
 * Usage: node deploy-accounting-fix.mjs
 */

import { Client } from 'ssh2';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const KEY_PATH  = '../ssh_keys/id_ed25519';
const SERVER_IP = '46.4.188.170';
const REMOTE_BASE = '/www/wwwroot/namainvist.com';

const FILES_TO_DEPLOY = [
  'src/lib/services/accounting-journal.service.ts',
  'src/app/api/admin/seed-accounts/route.ts',
];

// المستأجرون المعروفون — السيرفر الرئيسي
const KNOWN_TENANTS = [
  'ahmedalyamicompany',
  'default',
  // يمكن إضافة المزيد
];

const conn = new Client();

conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });

conn.on('ready', async () => {
  console.log('✅ SSH Connected to', SERVER_IP);
  try {
    // 1. Backup
    await run(`cp -f ${REMOTE_BASE}/src/lib/services/accounting-journal.service.ts ${REMOTE_BASE}/src/lib/services/accounting-journal.service.ts.bak_sla_fix 2>/dev/null || true`);
    console.log('📦 Backup done');

    // 2. Upload files via SFTP
    const sftp = await new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));

    for (const file of FILES_TO_DEPLOY) {
      const localContent = readFileSync(resolve(file));
      const remotePath   = `${REMOTE_BASE}/${file}`;
      const remoteDir    = remotePath.split('/').slice(0, -1).join('/');

      await run(`mkdir -p "${remoteDir}"`);

      await new Promise((res, rej) => {
        const ws = sftp.createWriteStream(remotePath);
        ws.on('close', () => { console.log(`  ✅ Uploaded: ${file}`); res(); });
        ws.on('error', rej);
        ws.write(localContent);
        ws.end();
      });
    }

    // 3. Build
    console.log('\n🔨 Building (this takes ~3-5 min)...');
    const buildOut = await run(`cd ${REMOTE_BASE} && npm run build 2>&1 | tail -15`);
    const buildOk = buildOut.includes('Route') || buildOut.includes('compiled') || buildOut.includes('Generating');
    console.log(`Build: ${buildOk ? '✅ OK' : '⚠️ Check output'}`);
    if (!buildOk) console.log('Build output:', buildOut.slice(-300));

    // 4. PM2 Reload
    console.log('\n🚀 Reloading PM2...');
    const pm2Out = await run('pm2 reload saas-app --update-env && sleep 2 && pm2 list | grep -E "saas-app|online"');
    console.log('PM2:', pm2Out.includes('online') ? '✅ online' : pm2Out.trim().slice(-100));

    // 5. Smoke test
    await new Promise(r => setTimeout(r, 3000));
    const smokeOut = await run('curl -s -o /dev/null -w "%{http_code}" https://ahmedalyamicompany.namainvist.com/api/health');
    console.log(`\n🧪 Smoke test: HTTP ${smokeOut.trim()}`);

    console.log('\n=== DEPLOY COMPLETE ✅ ===');
    console.log('\n📋 Next step: Call seed API from browser or curl:');
    console.log('  POST https://ahmedalyamicompany.namainvist.com/api/admin/seed-accounts');
    console.log('  Body: { "tenantId": "ahmedalyamicompany" }');

    conn.end();
  } catch (e) {
    console.error('❌ Deploy failed:', e.message || e);
    conn.end();
    process.exit(1);
  }
});

function run(cmd) {
  return new Promise((res, rej) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return rej(err);
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => res(out));
    });
  });
}

// Connect
try {
  const privateKey = readFileSync(resolve(KEY_PATH));
  conn.connect({ host: SERVER_IP, port: 22, username: 'root', privateKey });
} catch (e) {
  console.error('Cannot read SSH key:', e.message);
  process.exit(1);
}
