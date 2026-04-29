const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: '_ee4SWbxLVfH9b',
};

const ARCHIVE_LOCAL = path.join(__dirname, '..', 'deploy_patch_20260429_0628.tar.gz');
const ARCHIVE_REMOTE = '/tmp/deploy_patch_nama.tar.gz';

// Actual instances on this server
const INSTANCES = [
  { name: 'n1',       path: '/www/wwwroot/n1.namainvist.com',   pm2: 'n1-main',  skip_pm2_restart: false },
  { name: 'n11(saas)',path: '/www/wwwroot/n11.namainvist.com',  pm2: 'saas-app', skip_pm2_restart: false },
  { name: 'n7',       path: '/www/wwwroot/n7.namainvist.com',   pm2: 'n7',       skip_pm2_restart: false },
];

function sshExec(conn, cmd, label) {
  return new Promise((resolve) => {
    conn.exec(cmd, (err, stream) => {
      if (err) { console.log(`  ❌ exec error: ${err.message}`); return resolve({ code: 1, out: '' }); }
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', (code) => {
        if (label) console.log(`  ${label}: ${out.trim().slice(0, 200)}`);
        resolve({ code, out });
      });
    });
  });
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const data = fs.readFileSync(localPath);
      const ws = sftp.createWriteStream(remotePath);
      ws.on('close', () => { console.log(`  ✅ Uploaded (${(data.length/1024).toFixed(0)} KB)`); resolve(); });
      ws.on('error', reject);
      ws.write(data);
      ws.end();
    });
  });
}

async function deploy() {
  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve).on('error', reject).connect(CONFIG);
  });
  console.log('🔗 Connected to 46.4.188.170 (Fleet Server)\n');

  // Upload archive once
  console.log('📦 Uploading patch archive...');
  await uploadFile(conn, ARCHIVE_LOCAL, ARCHIVE_REMOTE);

  for (const inst of INSTANCES) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 ${inst.name} → ${inst.path}`);
    console.log('='.repeat(50));

    // Check exists
    const chk = await sshExec(conn, `test -f ${inst.path}/package.json && echo OK || echo MISS`);
    if (chk.out.includes('MISS')) {
      console.log(`  ⚠️  Path not found — skipping`);
      continue;
    }

    // Extract source files
    const ext = await sshExec(conn, `cd ${inst.path} && tar -xzf ${ARCHIVE_REMOTE} 2>&1`, 'extract');
    
    // Prisma db push (add new tables only — non-destructive)
    console.log('  🗄️  Prisma db push...');
    await sshExec(conn, `cd ${inst.path} && npx prisma db push --skip-generate 2>&1 | tail -2`, 'prisma');

    // Build
    console.log('  🔨 npm run build...');
    const build = await sshExec(conn, `cd ${inst.path} && npm run build 2>&1 | tail -6`, 'build');

    // Check build success
    if (build.out.includes('error') && !build.out.includes('compiled')) {
      console.log(`  ❌ Build has errors — checking...`);
      await sshExec(conn, `cd ${inst.path} && npm run build 2>&1 | grep 'error' | head -5`, 'errors');
      console.log(`  ⚠️  Skipping PM2 restart for ${inst.name} due to build errors`);
      continue;
    }

    // Restart PM2
    console.log(`  🔄 pm2 restart ${inst.pm2}...`);
    await sshExec(conn, `pm2 restart ${inst.pm2} 2>&1 | tail -3`, 'pm2');
    console.log(`  ✅ ${inst.name} deployed and restarted!`);
  }

  // Cleanup
  await sshExec(conn, `rm -f ${ARCHIVE_REMOTE}`, 'cleanup');
  conn.end();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Fleet deployment complete!');
  console.log('='.repeat(50));
}

deploy().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
