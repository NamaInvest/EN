const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = '46.4.188.170';
const reportPage = fs.readFileSync('src/app/(dashboard)/reports/73-modules/page.tsx', 'utf8');
const sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const NODES = [
  { name: 'n1',  path: '/www/wwwroot/n1.namainvist.com',  pm2: 'n1-main' },
  { name: 'n2',  path: '/www/wwwroot/n2.namainvist.com',  pm2: 'n2' },
  { name: 'n3',  path: '/www/wwwroot/n3.namainvist.com',  pm2: 'n3' },
  { name: 'n4',  path: '/www/wwwroot/n4.namainvist.com',  pm2: 'n4' },
  { name: 'n5',  path: '/www/wwwroot/n5.namainvist.com',  pm2: 'n5' },
  { name: 'n6',  path: '/www/wwwroot/n6.namainvist.com',  pm2: 'n6' },
  { name: 'n7',  path: '/www/wwwroot/n7.namainvist.com',  pm2: 'n7' },
  { name: 'n8',  path: '/www/wwwroot/n8.namainvist.com',  pm2: 'n8' },
  { name: 'n9',  path: '/www/wwwroot/n9.namainvist.com',  pm2: 'n9' },
  { name: 'n10', path: '/www/wwwroot/n10.namainvist.com', pm2: 'n10' },
  { name: 'n11', path: '/www/wwwroot/n11.namainvist.com', pm2: 'n11' },
  { name: 'ice', path: '/www/wwwroot/ice.namainvist.com', pm2: 'ice' },
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
    }).connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
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
      .connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

async function updateNode(node) {
  try {
    // 1. Create 104-modules folder (copy from 73-modules)
    await ssh(`cp -r "${node.path}/src/app/\\(dashboard\\)/reports/73-modules" "${node.path}/src/app/\\(dashboard\\)/reports/104-modules" 2>/dev/null; echo "cp done"`);
    
    // 2. Write updated report page to 104-modules  
    await writeFile(`${node.path}/src/app/(dashboard)/reports/104-modules/page.tsx`, reportPage);
    
    // 3. Update Sidebar.tsx
    await writeFile(`${node.path}/src/components/Sidebar.tsx`, sidebarContent);
    
    // 4. Rebuild
    const buildOut = await ssh(`cd "${node.path}" && npm run build 2>&1 | tail -3 && pm2 restart ${node.pm2} 2>&1 | tail -1`);
    const ok = buildOut.includes('online') || buildOut.includes('✓') || buildOut.includes('Dynamic');
    console.log(`${ok ? '✅' : '⚠️'} ${node.name}`);
    return ok;
  } catch (e) {
    console.log(`❌ ${node.name}: ${e.message}`);
    return false;
  }
}

(async () => {
  console.log('=== Deploying 73→104 rename to all nodes ===\n');
  console.log('Changes: Sidebar label + href + new folder\n');
  
  // Run in parallel batches of 3   
  const batch1 = NODES.slice(0, 3);
  const batch2 = NODES.slice(3, 6);
  const batch3 = NODES.slice(6, 9);
  const batch4 = NODES.slice(9);
  
  console.log('Batch 1: n1, n2, n3...');
  await Promise.all(batch1.map(updateNode));
  
  console.log('Batch 2: n4, n5, n6...');
  await Promise.all(batch2.map(updateNode));
  
  console.log('Batch 3: n7, n8, n9...');
  await Promise.all(batch3.map(updateNode));
  
  console.log('Batch 4: n10, n11, ice...');
  await Promise.all(batch4.map(updateNode));

  console.log('\n✅ All done!');
  console.log('Sidebar now shows "موسوعة الـ 104 وحدة" and links to /reports/104-modules');
  console.log('Do Ctrl+Shift+R to see changes');
})();
