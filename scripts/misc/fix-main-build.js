const { Client } = require('ssh2');
const fs = require('fs');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      console.log(`Executing: ${cmd}`);
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { process.stdout.write(d); out += d; });
        stream.stderr.on('data', d => { process.stderr.write(d); out += d; });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function writeFile(remotePath, localPath) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { console.error('sftp error:', err.message); return r(); }
        const stream = sftp.createWriteStream(remotePath);
        stream.write(fs.readFileSync(localPath));
        stream.end();
        stream.on('close', () => { console.log('[✓] Uploaded', remotePath); c.end(); r(); });
        stream.on('error', e => { console.error('[✗]', remotePath, e.message); c.end(); r(); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  const base = '/www/wwwroot/namainvist.com';
  
  // Upload the correct globals.css
  console.log(`\n=== Uploading fixed globals.css to MAIN ===`);
  await writeFile(`${base}/src/app/globals.css`, 'src/app/globals.css');
  
  console.log(`\n=== Clearing Cache and Building Next.js for MAIN ===`);
  await ssh(`cd ${base} && rm -rf .next && npm run build`);
  
  console.log(`\n=== Restarting PM2 MAIN ===`);
  await ssh(`pm2 restart main-site`);
  
  console.log('\n=== Done ===');
})();
