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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function writeFile(c, remotePath, content) {
  return new Promise(r => {
      c.sftp((err, sftp) => {
        if (err) { console.error('sftp error:', err.message); return r(); }
        const stream = sftp.createWriteStream(remotePath);
        stream.write(content);
        stream.end();
        stream.on('close', () => { console.log('[✓]', remotePath.replace('/www/wwwroot/', '')); r(); });
        stream.on('error', e => { console.error('[✗]', remotePath, e.message); r(); });
      });
  });
}

(async () => {
  // 1. Find main-site working directory
  const pm2Info = await ssh('pm2 show main-site 2>&1');
  console.log('=== PM2 main-site info ===');
  console.log(pm2Info.substring(0, 800));

  // Extract cwd from pm2 show
  const cwdMatch = pm2Info.match(/exec cwd\s+\│\s+(.+?)\s+\│/);
  const rootMatch = pm2Info.match(/root\s+\│\s+(.+?)\s+\│/);
  const cwd = (cwdMatch && cwdMatch[1].trim()) || (rootMatch && rootMatch[1].trim());
  console.log('\nDetected cwd:', cwd);

  if (!cwd) {
    // Try to find by listing common paths
    const check = await ssh('ls /www/wwwroot/namainvist.com/src/app/ 2>&1');
    console.log('namainvist.com/src/app/ listing:', check);
    
    if (!check.includes('No such file')) {
      const base = '/www/wwwroot/namainvist.com';
      console.log('\nDeploying to /www/wwwroot/namainvist.com ...');
      await writeFile(base + '/src/app/(dashboard)/reports/73-modules/page.tsx', file73);
      await writeFile(base + '/src/app/page.tsx', filePage);
    }
  } else {
    await writeFile(cwd + '/src/app/(dashboard)/reports/73-modules/page.tsx', file73);
    await writeFile(cwd + '/src/app/page.tsx', filePage);
  }

  // 2. Restart main-site
  const restart = await ssh('pm2 restart main-site 2>&1');
  console.log('\n=== PM2 restart main-site ===');
  console.log(restart);

  // 3. Also restart n11
  const restartN11 = await ssh('pm2 restart n11 2>&1');
  console.log('\n=== PM2 restart n11 ===');
  console.log(restartN11);

})();
