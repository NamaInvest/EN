const { Client } = require('ssh2');
const fs = require('fs');

const filePage = fs.readFileSync('src/app/page.tsx', 'utf8');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { console.error('sftp error:', err.message); c.end(); return r(false); }
        const stream = sftp.createWriteStream(remotePath);
        stream.write(content);
        stream.end();
        stream.on('close', () => { console.log('[✓] Written:', remotePath); c.end(); r(true); });
        stream.on('error', e => { console.error('[✗]', e.message); c.end(); r(false); });
      });
    }).on('error', e => { console.error('[connect error]', e.message); r(false); })
     .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

(async () => {
  const path = '/www/wwwroot/namainvist.com/src/app/page.tsx';
  
  // Write file
  const ok = await writeFile(path, filePage);
  if (!ok) { process.exit(1); }

  // Build
  console.log('\n🔨 Building namainvist.com...');
  const build = await ssh('cd /www/wwwroot/namainvist.com && npm run build 2>&1');
  console.log(build.slice(-600));
  
  if (build.includes('Build exit code: 0') || build.includes('Finalizing page optimization')) {
    const restart = await ssh('pm2 restart main-site 2>&1 | tail -5');
    console.log('\n🔄', restart);
    console.log('\n✅ Done! namainvist.com updated');
  } else {
    console.log('\n❌ Build may have issues, check logs');
  }
})();
