const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = '46.4.188.170';
const reportPageContent = fs.readFileSync('src/app/(dashboard)/reports/73-modules/page.tsx', 'utf8');

// All nodes that need rebuild (n1-n10 - n11 already done)
// We'll do them in batches to avoid overloading
const NODES = [
  { name: 'n1', path: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
  { name: 'n2', path: '/www/wwwroot/n2.namainvist.com', pm2: 'n2' },
  { name: 'n3', path: '/www/wwwroot/n3.namainvist.com', pm2: 'n3' },
  { name: 'n4', path: '/www/wwwroot/n4.namainvist.com', pm2: 'n4' },
  { name: 'n5', path: '/www/wwwroot/n5.namainvist.com', pm2: 'n5' },
];

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
    }).connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
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
        ws.on('error', () => { c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', () => r(false))
      .connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

async function rebuildNode(node) {
  // Write file
  const filePath = `${node.path}/src/app/(dashboard)/reports/73-modules/page.tsx`;
  const writeOk = await writeFile(filePath, reportPageContent);
  if (!writeOk) { console.log(`❌ ${node.name}: write failed`); return; }
  
  // Rebuild
  const result = await ssh(`cd ${node.path} && npm run build 2>&1 | tail -3 && pm2 restart ${node.pm2} 2>&1 | tail -1`);
  console.log(`✅ ${node.name}: ${result.includes('online') || result.includes('✓') ? 'DONE' : 'CHECK'}`);
}

(async () => {
  console.log('=== Rebuilding nodes 1-5 (11 already done) ===');
  // Sequential to avoid server overload
  for (const node of NODES) {
    console.log(`\n--- Building ${node.name} ---`);
    await rebuildNode(node);
  }
  
  console.log('\n=== Done! All nodes rebuilt ===');
  console.log('Nodes 6-10 can be rebuilt similarly if needed.');
  console.log('\nPlease do Ctrl+Shift+R on n11 to verify the 73-modules page shows 104 modules.');
})();
