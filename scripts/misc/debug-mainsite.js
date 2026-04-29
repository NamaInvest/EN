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
  // Find all page.tsx files in namainvist.com
  const found = await ssh('find /www/wwwroot/namainvist.com/src -name "page.tsx" 2>&1 | grep -v node_modules | grep -v ".next"');
  console.log('All page.tsx files:');
  console.log(found);

  // Check what "73" content is in the actual page.tsx
  const content73 = await ssh('grep -n "73" /www/wwwroot/namainvist.com/src/app/page.tsx 2>&1 | head -10');
  console.log('\nLines with "73" in current page.tsx:');
  console.log(content73);

  // Check file modification time
  const modTime = await ssh('ls -la /www/wwwroot/namainvist.com/src/app/page.tsx 2>&1');
  console.log('\nFile mod time:', modTime);
})();
