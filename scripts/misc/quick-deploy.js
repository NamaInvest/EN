const { Client } = require('ssh2');
const fs = require('fs');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      console.log(`Executing: ${cmd.slice(0, 80)}...`);
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
  const bases = ['/www/wwwroot/namainvist.com', '/www/wwwroot/n11.namainvist.com'];

  for (const base of bases) {
    console.log(`\n=== Uploading fixed cash-flow to ${base} ===`);
    await writeFile(`${base}/src/app/api/reports/cash-flow/route.ts`, 'src/app/api/reports/cash-flow/route.ts');

    console.log(`\n=== Building ${base} ===`);
    await ssh(`cd ${base} && rm -rf .next && npm run build`);
  }

  console.log(`\n=== Restarting PM2 ===`);
  await ssh(`pm2 restart main-site && pm2 restart saas-app`);
  console.log('\n=== Done ===');
})();
