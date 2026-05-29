const { Client } = require('ssh2');
const fs = require('fs');

const THEME_FILE = 'src/components/ThemeSwitcher.tsx';

// Node configuration
const NODES = [
  { name: 'n2',  dir: '/www/wwwroot/n2.namainvist.com',  pm2: 'n2',   port: 3002 },
  { name: 'n3',  dir: '/www/wwwroot/n3.namainvist.com',  pm2: 'n3',   port: 3003 },
  { name: 'n4',  dir: '/www/wwwroot/n4.namainvist.com',  pm2: 'n4',   port: 3004 },
  { name: 'n5',  dir: '/www/wwwroot/n5.namainvist.com',  pm2: 'n5',   port: 3005 },
  { name: 'n6',  dir: '/www/wwwroot/n6.namainvist.com',  pm2: 'n6',   port: 3006 },
  { name: 'n7',  dir: '/www/wwwroot/n7.namainvist.com',  pm2: 'n7',   port: 3007 },
  { name: 'n8',  dir: '/www/wwwroot/n8.namainvist.com',  pm2: 'n8',   port: 3008 },
  { name: 'n9',  dir: '/www/wwwroot/n9.namainvist.com',  pm2: 'n9',   port: 3009 },
  { name: 'n10', dir: '/www/wwwroot/n10.namainvist.com', pm2: 'n10',  port: 3010 },
  { name: 'n11', dir: '/www/wwwroot/n11.namainvist.com', pm2: 'n11',  port: 3011 },
];

function connect() {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => r(c)).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function ssh(c, cmd) {
  return new Promise(r => {
    c.exec(cmd, (err, stream) => {
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => r(out.trim()));
    });
  });
}

function sftp_upload(sftp, localPath, remotePath) {
  return new Promise((res, rej) => sftp.fastPut(localPath, remotePath, e => e ? rej(e) : res()));
}

async function buildNode(c, sftp, node) {
  const logFile = `/tmp/${node.name}_build.log`;
  
  try {
    // 1. Upload ThemeSwitcher
    await sftp_upload(sftp, THEME_FILE, `${node.dir}/src/components/ThemeSwitcher.tsx`);
    
    // 2. Check if node dir has theme file
    const hasTheme = await ssh(c, `grep -c "inline-block" "${node.dir}/src/components/ThemeSwitcher.tsx" 2>/dev/null || echo "0"`);
    
    // 3. Start build in background
    await ssh(c, `cd "${node.dir}" && npm run build > "${logFile}" 2>&1 &`);
    
    return { node: node.name, status: 'building', hasTheme: parseInt(hasTheme) > 0 };
  } catch (e) {
    return { node: node.name, status: 'error', error: e.message };
  }
}

async function waitForBuild(c, node, logFile, timeout = 480000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 15000)); // check every 15s
    
    const running = await ssh(c, `pgrep -f "next build" | grep -c "" 2>/dev/null || echo "0"`);
    const lastLine = await ssh(c, `tail -3 "${logFile}" 2>/dev/null`);
    
    if (lastLine.includes('○') || lastLine.includes('ƒ') || lastLine.includes('Route (app)')) {
      return { success: true, log: lastLine };
    }
    if (lastLine.includes('error') || lastLine.includes('Error')) {
      return { success: false, log: lastLine };
    }
    
    process.stdout.write('.');
  }
  return { success: false, log: 'TIMEOUT' };
}

async function main() {
  console.log('🚀 Fleet rebuild — n2 through n11\n');
  
  const c = await connect();
  const sftp = await new Promise((res, rej) => c.sftp((e, s) => e ? rej(e) : res(s)));

  // BATCH 1: n2, n3, n4 (3 at a time)
  // BATCH 2: n5, n6, n7
  // BATCH 3: n8, n9, n10, n11

  const BATCH_SIZE = 3;
  const results = {};
  
  for (let i = 0; i < NODES.length; i += BATCH_SIZE) {
    const batch = NODES.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Batch: ${batch.map(n => n.name).join(', ')}`);
    
    // Start builds for this batch
    for (const node of batch) {
      const logFile = `/tmp/${node.name}_build.log`;
      process.stdout.write(`  🔨 ${node.name}: uploading ThemeSwitcher... `);
      
      try {
        await sftp_upload(sftp, THEME_FILE, `${node.dir}/src/components/ThemeSwitcher.tsx`);
        console.log('✅ uploaded');
        
        // Start background build
        await ssh(c, `cd "${node.dir}" && npm run build > "${logFile}" 2>&1 & echo $!`);
        console.log(`  ⚙️  ${node.name}: build started`);
      } catch (e) {
        console.log(`❌ ${node.name}: ${e.message}`);
        results[node.name] = 'error';
      }
    }
    
    // Wait for this batch to complete (up to 8 minutes)
    console.log(`\n  ⏳ Waiting for batch to complete (up to 8 min)...`);
    const WAIT_START = Date.now();
    
    while (Date.now() - WAIT_START < 480000) {
      await new Promise(r => setTimeout(r, 20000));
      
      let allDone = true;
      for (const node of batch) {
        if (results[node.name]) continue; // already resolved
        
        const logFile = `/tmp/${node.name}_build.log`;
        const lastLines = await ssh(c, `tail -5 "${logFile}" 2>/dev/null`);
        
        if (lastLines.includes('Compiled successfully') || lastLines.includes('(Static)') || lastLines.includes('Route (app)') || lastLines.includes('(Dynamic)')) {
          // Build succeeded, restart the node
          console.log(`\n  ✅ ${node.name}: Build DONE — restarting...`);
          await ssh(c, `pm2 restart ${node.pm2} 2>/dev/null && echo "✅" || pm2 start "${node.dir}/ecosystem.config.js" --only ${node.pm2} 2>/dev/null`);
          await new Promise(r => setTimeout(r, 2000));
          
          // Verify HTTP
          const status = await ssh(c, `curl -s -o /dev/null -w "%{http_code}" -H "Host: ${node.name}.namainvist.com" http://localhost:${node.port}/login --max-time 5 2>/dev/null || echo "000"`);
          results[node.name] = { success: true, http: status.trim() };
          console.log(`  ✅ ${node.name}: HTTP ${status.trim()}`);
          
        } else if (lastLines.includes('error') && lastLines.includes('Error:')) {
          console.log(`\n  ❌ ${node.name}: Build FAILED`);
          console.log(`     Last: ${lastLines.split('\n').pop()}`);
          results[node.name] = { success: false, error: lastLines.split('\n').pop() };
        } else {
          allDone = false;
          process.stdout.write('.');
        }
      }
      
      if (Object.keys(results).length >= i + BATCH_SIZE || allDone) break;
    }
    
    // Force-complete any still-building nodes in this batch
    for (const node of batch) {
      if (!results[node.name]) {
        const logFile = `/tmp/${node.name}_build.log`;
        const lastLines = await ssh(c, `tail -5 "${logFile}" 2>/dev/null`);
        console.log(`\n  ⚠️  ${node.name}: Timeout — Last log: ${lastLines.split('\n').pop() || 'empty'}`);
        results[node.name] = { success: false, error: 'TIMEOUT' };
      }
    }
  }
  
  // Final verification: curl all nodes
  console.log('\n\n📊 === FINAL VERIFICATION ===');
  
  // Also check n1 (already rebuilt)
  const n1Status = await ssh(c, `curl -s -o /dev/null -w "%{http_code}" -H "Host: n1.namainvist.com" http://localhost:3001/login --max-time 5 2>/dev/null || echo "000"`);
  console.log(`n1: HTTP ${n1Status.trim()} (built earlier)`);
  
  for (const node of NODES) {
    const r = results[node.name];
    if (r && r.success) {
      console.log(`${node.name}: ✅ HTTP ${r.http}`);
    } else if (r && !r.success) {
      console.log(`${node.name}: ❌ ${r.error || 'failed'}`);
    } else {
      const status = await ssh(c, `curl -s -o /dev/null -w "%{http_code}" -H "Host: ${node.name}.namainvist.com" http://localhost:${node.port}/login --max-time 5 2>/dev/null || echo "000"`);
      console.log(`${node.name}: HTTP ${status.trim()}`);
    }
  }
  
  console.log('\n✅ Fleet rebuild complete!');
  c.end();
}

main().catch(console.error);
