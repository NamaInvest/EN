const { Client } = require('ssh2');
const fs = require('fs');

// Read the local page we want
const localPage = fs.readFileSync('src/app/page.tsx', 'utf8');

function sshRun(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => { c.end(); r({ out, code }); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function sftp_write(remotePath, content) {
  return new Promise((resolve, reject) => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) return reject(err);
        // Use a writable stream
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        const buf = Buffer.from(content, 'utf8');
        ws.on('close', () => { c.end(); resolve(true); });
        ws.on('error', (e) => { c.end(); reject(e); });
        ws.end(buf);
      });
    }).on('error', reject)
      .connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  console.log('Local page.tsx size:', localPage.length, 'bytes');
  console.log('Contains "104 وحدة":', localPage.includes('104 وحدة'));
  console.log('Contains modulesList:', localPage.includes('modulesList'));

  // Check current server file
  const { out: serverMd5 } = await sshRun('md5sum /www/wwwroot/namainvist.com/src/app/page.tsx 2>&1');
  console.log('Server file md5:', serverMd5.trim());
  
  const localMd5Buf = require('crypto').createHash('md5').update(Buffer.from(localPage, 'utf8')).digest('hex');
  console.log('Local file md5:', localMd5Buf);

  // Write with sftp
  console.log('\nWriting file via SFTP...');
  await sftp_write('/www/wwwroot/namainvist.com/src/app/page.tsx', localPage);
  
  // Verify
  const { out: newMd5 } = await sshRun('md5sum /www/wwwroot/namainvist.com/src/app/page.tsx 2>&1');
  console.log('New server file md5:', newMd5.trim());
  
  const md5Match = newMd5.includes(localMd5Buf);
  console.log('MD5 match:', md5Match ? '✅ YES' : '❌ NO');
  
  if (md5Match) {
    // Clean rebuild
    console.log('\n🔨 Clean rebuild...');
    await sshRun('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | tail -25');
    await sshRun('pm2 restart main-site 2>&1 | tail -2');
    console.log('\n✅ Done!');
  } else {
    console.log('\n❌ File mismatch - investigate further');
    const { out: sample } = await sshRun('head -5 /www/wwwroot/namainvist.com/src/app/page.tsx');
    console.log('Server file start:\n', sample);
  }
})();
