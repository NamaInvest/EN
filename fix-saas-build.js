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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

(async () => {
  const base = '/www/wwwroot/n11.namainvist.com';
  
  // Upload the correct globals.css
  console.log(`\n=== Uploading fixed globals.css to SAAS ===`);
  await writeFile(`${base}/src/app/globals.css`, 'src/app/globals.css');
  
  // Upload the correct route.ts to fix the duplicate round2 import
  console.log(`\n=== Uploading correct purchases/route.ts to SAAS ===`);
  await writeFile(`${base}/src/app/api/purchases/route.ts`, 'src/app/api/purchases/route.ts');
  
  console.log(`\n=== Building Next.js for SAAS ===`);
  await ssh(`cd ${base} && npm run build`);
  
  console.log(`\n=== Restarting PM2 SAAS ===`);
  await ssh(`pm2 restart saas-app`);
  
  console.log('\n=== Done ===');
})();
