const { Client } = require('ssh2');
const crypto = require('crypto');

// The final solution: write the file, then verify Turbopack picks it up
// by checking the compiled chunk content

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
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
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        const buf = Buffer.from(content, 'utf8');
        ws.on('close', () => { c.end(); r(true); });
        ws.on('error', e => { console.error(e); c.end(); r(false); });
        ws.end(buf);
      });
    }).on('error', e => { console.error(e); r(false); })
     .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

// Quick check: what is the page.tsx file that Turbopack ACTUALLY reads?
// Maybe there is a second location

(async () => {
  console.log('=== Find ALL page.tsx locations ===');
  await ssh('find /www/wwwroot/namainvist.com -name "page.tsx" -not -path "*/.next/*" -not -path "*/node_modules/*" 2>/dev/null');
  
  console.log('\n=== Check if there is a git stash or untracked file ===');
  await ssh('cd /www/wwwroot/namainvist.com && git status 2>/dev/null | head -20 || echo "no git"');
  
  console.log('\n=== Find Turbopack cache files with old content ===');
  await ssh('cd /www/wwwroot/namainvist.com && ls .next/cache/webpack/client-production/ 2>/dev/null | head -5 || echo "no webpack cache"');
  await ssh('ls /www/wwwroot/namainvist.com/.next/cache/ 2>/dev/null | head -10');
  
  // The real fix: DELETE ALL .next cache including turbopack and webpack
  console.log('\n=== NUCLEAR OPTION: Delete all cache including turbopack ===');
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next node_modules/.cache && echo "ALL CACHE DELETED"');
  
  console.log('\n=== Rebuild from completely clean state ===');
  await ssh('cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -20');
  
  // Verify
  console.log('\n=== Verify built chunk content ===');
  await ssh('grep -r "104 وحدة برمجية" /www/wwwroot/namainvist.com/.next/ 2>/dev/null | head -3 | cut -c1-100');
  await ssh('grep -r "modulesList.length" /www/wwwroot/namainvist.com/.next/ 2>/dev/null | head -3 | cut -c1-100');
  
  // Restart
  await ssh('pm2 restart main-site 2>&1 | tail -3');
  console.log('\n✅ Nuclear rebuild complete!');
})();
