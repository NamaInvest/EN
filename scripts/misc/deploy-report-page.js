const { Client } = require('ssh2');
const fs = require('fs');

const localContent = fs.readFileSync('src/app/(dashboard)/reports/73-modules/page.tsx', 'utf8');

const NODES = [
  '/www/wwwroot/n1.namainvist.com',
  '/www/wwwroot/n2.namainvist.com',
  '/www/wwwroot/n3.namainvist.com',
  '/www/wwwroot/n4.namainvist.com',
  '/www/wwwroot/n5.namainvist.com',
  '/www/wwwroot/n6.namainvist.com',
  '/www/wwwroot/n7.namainvist.com',
  '/www/wwwroot/n8.namainvist.com',
  '/www/wwwroot/n9.namainvist.com',
  '/www/wwwroot/n10.namainvist.com',
  '/www/wwwroot/n11.namainvist.com',
  '/www/wwwroot/ice.namainvist.com',
];

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { c.end(); r(true); });
        ws.on('error', e => { c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', () => r(false))
      .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

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

console.log(`Local file: ${localContent.length} bytes`);
console.log('Contains MODULES_DATA:', localContent.includes('MODULES_DATA'));
console.log('Lines:', localContent.split('\n').length);

(async () => {
  // Write to all nodes in parallel
  const results = await Promise.all(
    NODES.map(async (nodePath) => {
      const filePath = `${nodePath}/src/app/(dashboard)/reports/73-modules/page.tsx`;
      const ok = await writeFile(filePath, localContent);
      console.log(`${ok ? '✅' : '❌'} ${nodePath.split('/').pop()}`);
      return ok;
    })
  );
  
  const success = results.filter(Boolean).length;
  console.log(`\n${success}/${NODES.length} nodes updated`);
  
  // Restart all PM2 processes for the nodes
  console.log('\n=== Restarting all nodes ===');
  await ssh('pm2 restart n1-main n11 n2 n3 n4 n5 n6 n7 n8 n9 n10 2>&1 | tail -5');
  
  // Verify on n11
  const check = await ssh('wc -l /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/reports/73-modules/page.tsx && grep -c "MODULES_DATA" /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/reports/73-modules/page.tsx');
  console.log('\nN11 verify:', check);

  console.log('\n✅ All done! The 73-modules report page is updated on all nodes.');
  console.log('Hard refresh (Ctrl+Shift+R) on n11 to see the changes.');
})();
