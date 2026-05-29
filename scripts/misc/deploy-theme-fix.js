const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const N1 = '/www/wwwroot/n1.namainvist.com';

// Use sftp to upload the file properly
function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function ssh(cmd, client) {
  return new Promise(r => {
    client.exec(cmd, (err, stream) => {
      let out = '';
      stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', d => { out += d; process.stdout.write('[ERR] ' + d.toString()); });
      stream.on('close', () => r(out));
    });
  });
}

async function run() {
  const c = new Client();
  await new Promise(r => c.on('ready', r).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' }));

  // SFTP upload for ThemeSwitcher (more reliable than heredoc)
  console.log('=== SFTP: Uploading ThemeSwitcher to n1 ===');
  const sftp = await new Promise((res, rej) => c.sftp((err, s) => err ? rej(err) : res(s)));
  await uploadFile(sftp, 'src/components/ThemeSwitcher.tsx', `${N1}/src/components/ThemeSwitcher.tsx`);
  console.log('✅ ThemeSwitcher uploaded via SFTP');

  // Also upload to all other nodes  
  for (let i = 2; i <= 11; i++) {
    const nodeDir = `/www/wwwroot/n${i}.namainvist.com`;
    try {
      await uploadFile(sftp, 'src/components/ThemeSwitcher.tsx', `${nodeDir}/src/components/ThemeSwitcher.tsx`);
      console.log(`✅ ThemeSwitcher → n${i}`);
    } catch (e) {
      console.log(`⚠️ n${i}: ${e.message}`);
    }
  }

  // Check why /pos returns 404 on n1
  console.log('\n=== Diagnosing /pos 404 on n1 ===');
  await ssh(`
    # Full curl with headers
    curl -v http://localhost:3001/pos 2>&1 | tail -20
  `, c);

  // Try building n1 with only ThemeSwitcher change (quick)
  console.log('\n=== Rebuilding n1 (this takes ~3 min) ===');
  await ssh(`
    cd ${N1}
    # Quick rebuild
    echo "Starting rebuild at $(date)"
    npm run build > /tmp/n1_theme_build.log 2>&1 &
    BUILD_PID=$!
    echo "Build PID: $BUILD_PID"
    echo "Build started in background — will check in 3 minutes"
    echo $BUILD_PID > /tmp/n1_build_pid.txt
  `, c);

  c.end();
  console.log('\n✅ Build started in background on n1');
  console.log('Check progress: ssh root@46.4.188.170 "tail -f /tmp/n1_theme_build.log"');
}

run().catch(console.error);
