const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = '46.4.188.170';

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { c.end(); r(true); });
        ws.on('error', () => { c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', () => r(false))
      .connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

const guardContent = fs.readFileSync('src/components/GlobalAuthGuard.tsx', 'utf8');

(async () => {
  console.log('=== Uploading fixed GlobalAuthGuard.tsx ===');
  const ok = await writeFile('/www/wwwroot/namainvist.com/src/components/GlobalAuthGuard.tsx', guardContent);
  console.log(ok ? '✅ Uploaded' : '❌ Upload failed');

  console.log('\n=== Rebuilding namainvist.com ===');
  await ssh('cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart main-site 2>&1 | tail -1');

  console.log('\n=== Test: curl response ===');
  await ssh('sleep 2 && curl -s -o /dev/null -w "HTTP: %{http_code} | Redirect: %{redirect_url} | Size: %{size_download}" http://localhost:2999/');

  console.log('\n\n✅ Done! The landing page should now show for ALL visitors (signed-in or not)');
})();
