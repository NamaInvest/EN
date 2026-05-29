const { Client } = require('ssh2');
const fs = require('fs');

const localPageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { c.end(); r(true); });
        ws.on('error', e => { console.error(e.message); c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', e => { console.error(e.message); r(false); })
     .connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  // 1. Check git status
  console.log('=== Git status ===');
  await ssh('cd /www/wwwroot/namainvist.com && git status 2>&1 | head -10');

  // 2. Write our file  
  console.log('\n=== Writing file ===');
  const ok = await writeFile('/www/wwwroot/namainvist.com/src/app/page.tsx', localPageContent);
  console.log('Write result:', ok);
  
  // 3. Commit the change so git doesn't reset it
  console.log('\n=== Git add and commit ===');
  await ssh('cd /www/wwwroot/namainvist.com && git add src/app/page.tsx && git commit -m "Update landing page: 104 modules" 2>&1 || echo "no git or already committed"');
  
  // 4. Also check if Turbopack uses a .turbo directory  
  console.log('\n=== Turbo cache ===');
  await ssh('ls /www/wwwroot/namainvist.com/.turbo/ 2>/dev/null || echo "no .turbo dir"');
  
  // 5. Nuclear: delete .next AND node_modules/.cache AND do fresh build
  console.log('\n=== Clean rebuild ===');
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next node_modules/.cache .turbo && npm run build 2>&1 | tail -15');
  
  // 6. Verify the built RSC/HTML
  console.log('\n=== Verify built HTML ===');
  await ssh('grep -c "104" /www/wwwroot/namainvist.com/.next/server/app/index.html 2>/dev/null');
  await ssh('grep "73 قسم\\|104 وحدة" /www/wwwroot/namainvist.com/.next/server/app/index.html 2>/dev/null | head -3');
  
  // 7. Restart
  await ssh('pm2 restart main-site 2>&1 | tail -2');
  console.log('\n✅ Done!');
})();
