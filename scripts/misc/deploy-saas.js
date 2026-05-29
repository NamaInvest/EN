const { Client } = require('ssh2');
const fs = require('fs');

const filesToUpload = [
  'src/app/globals.css',
  'src/app/login/page.tsx',
  'next.config.ts',
  'electron/main.js',
  'ELECTRON_APP_ARCHITECTURE_AND_FIXES.md'
];

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
        stream.on('close', () => { console.log('[✓]', remotePath); c.end(); r(); });
        stream.on('error', e => { console.error('[✗]', remotePath, e.message); c.end(); r(); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  const base = '/www/wwwroot/n11.namainvist.com';
  
  console.log(`\n=== Uploading files to SAAS-APP ===`);
  for (const file of filesToUpload) {
    await writeFile(`${base}/${file}`, file);
  }
  
  console.log(`\n=== Building Next.js for SAAS-APP ===`);
  await ssh(`cd ${base} && rm -rf .next && npm run build`);
  
  console.log(`\n=== Restarting PM2 SAAS-APP ===`);
  await ssh(`pm2 restart saas-app`);
  
  console.log('\n=== Done ===');
})();
