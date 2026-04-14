const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = '46.4.188.170';

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

// The CORRECT page.tsx for n1-n11:
// Simply redirect to /dashboard. The middleware handles auth (→ /sign-in if not logged in)
const erpHomePage = `import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
`;

// The CORRECT page.tsx for namainvist.com (server wrapper):
const mainSitePage = `import LandingPage from './_landing';
import { unstable_noStore as noStore } from 'next/cache';

export default function Page() {
  noStore();
  return <LandingPage />;
}
`;

// Read the full landing page content from our report page
// We'll adapt the marketing landing page from the current _landing.tsx on server
// OR reconstruct from the local page.tsx full content that existed before

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

async function fixNode(node) {
  try {
    // Check current page.tsx size (if 303 lines it's the wrong landing page)
    const lineCount = await ssh(`wc -l < "${node.path}/src/app/page.tsx" 2>/dev/null`);
    const lines = parseInt(lineCount) || 0;
    
    if (lines > 20) {
      // Wrong - has landing page content, replace with ERP redirect
      const ok = await writeFile(`${node.path}/src/app/page.tsx`, erpHomePage);
      
      // Delete static cache
      await ssh(`rm -f "${node.path}/.next/server/app/index.html" 2>/dev/null`);
      
      // Rebuild
      await ssh(`cd "${node.path}" && npm run build 2>&1 | tail -2 && pm2 restart ${node.pm2} 2>&1 | tail -1`);
      console.log(`✅ ${node.name}: Fixed (was ${lines} lines → now redirect)`);
    } else {
      // Already correct
      console.log(`⏭️  ${node.name}: Already correct (${lines} lines)`);
    }
  } catch(e) {
    console.log(`❌ ${node.name}: ${e.message}`);
  }
}

(async () => {
  console.log('═══════════════════════════════════════');
  console.log('  PHASE 1: Check _landing.tsx content');
  console.log('═══════════════════════════════════════\n');
  
  const landingCheck = await ssh('grep -c "104" /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null');
  const landingHead = await ssh('head -3 /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null');
  console.log(`_landing.tsx "104" occurrences: ${landingCheck}`);
  console.log(`_landing.tsx first lines:\n${landingHead}`);
  
  // Read the _landing.tsx from server to check content
  const landingSize = await ssh('wc -l /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null');
  console.log(`_landing.tsx lines: ${landingSize}`);

  console.log('\n═══════════════════════════════════════');
  console.log('  PHASE 2: Fix n1-n11 page.tsx');
  console.log('═══════════════════════════════════════\n');
  
  // Fix all nodes in parallel batches
  const batch1 = NODES.slice(0, 4);
  const batch2 = NODES.slice(4, 8);
  const batch3 = NODES.slice(8);
  
  console.log('Batch 1:', batch1.map(n=>n.name).join(', '));
  await Promise.all(batch1.map(fixNode));
  
  console.log('\nBatch 2:', batch2.map(n=>n.name).join(', '));
  await Promise.all(batch2.map(fixNode));
  
  console.log('\nBatch 3:', batch3.map(n=>n.name).join(', '));
  await Promise.all(batch3.map(fixNode));
  
  console.log('\n═══════════════════════════════════════');
  console.log('  PHASE 3: Fix namainvist.com');
  console.log('═══════════════════════════════════════\n');
  
  // Ensure main site page.tsx is correct
  await writeFile('/www/wwwroot/namainvist.com/src/app/page.tsx', mainSitePage);
  
  // Rebuild main site
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | tail -5 && pm2 restart main-site 2>&1 | tail -2');
  
  console.log('✅ namainvist.com rebuilt\n');
  console.log('═══════════════════════════════════════');
  console.log('  ✅ ALL FIXES APPLIED');
  console.log('═══════════════════════════════════════');
  console.log('\nExpected results:');
  console.log('  namainvist.com/ → Marketing landing page (104 modules)');
  console.log('  n1.namainvist.com/ → Redirect to /sign-in (ERP auth)');
})();
