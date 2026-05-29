const { Client } = require('ssh2');
const fs = require('fs');

const file73   = fs.readFileSync('src/app/(dashboard)/reports/73-modules/page.tsx', 'utf8');
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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { console.error('sftp error:', err.message); c.end(); return r(); }
        const stream = sftp.createWriteStream(remotePath);
        stream.write(content);
        stream.end();
        stream.on('close', () => { console.log('[✓]', remotePath.replace('/www/wwwroot/', '')); c.end(); r(); });
        stream.on('error', e => { console.error('[✗]', e.message); c.end(); r(); });
      });
    }).on('error', e => { console.error('[connect error]', e.message); r(); })
     .connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  // 1. Find all n11 directories
  const listing = await ssh('ls /www/wwwroot/');
  const allDirs = listing.split('\n').map(d => d.trim()).filter(Boolean);
  const n11Dirs = allDirs.filter(d => d.includes('n11'));
  const mainDir = allDirs.find(d => d === 'namainvist.com');

  console.log('n11 dirs found:', n11Dirs);
  console.log('main domain dir:', mainDir || 'NOT FOUND');

  // 2. Deploy to n11
  for (const dir of n11Dirs) {
    const base = '/www/wwwroot/' + dir;
    await writeFile(base + '/src/app/(dashboard)/reports/73-modules/page.tsx', file73);
    await writeFile(base + '/src/app/page.tsx', filePage);
  }

  // 3. Deploy to main domain if separate
  if (mainDir && !n11Dirs.includes(mainDir)) {
    const base = '/www/wwwroot/' + mainDir;
    await writeFile(base + '/src/app/(dashboard)/reports/73-modules/page.tsx', file73);
    await writeFile(base + '/src/app/page.tsx', filePage);
  }

  // 4. Show PM2 list to confirm n11 process
  const pm2 = await ssh('pm2 list --no-color 2>&1 | grep -i n11');
  console.log('\nPM2 n11 processes:\n', pm2 || '(not found)');

  console.log('\n✅ Deploy complete');
})();
