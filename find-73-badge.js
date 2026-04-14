const { Client } = require('ssh2');
const fs = require('fs');

// Check N11 path for the modules report page
const N11_PATH = '/www/wwwroot/n11.namainvist.com';

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
        ws.on('close', () => { console.log('[✓]', remotePath.split('/').pop()); c.end(); r(true); });
        ws.on('error', e => { console.error('[✗]', e.message); c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', e => { console.error(e.message); r(false); })
      .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const localReportPage = fs.readFileSync('src/app/(dashboard)/reports/73-modules/page.tsx', 'utf8');

(async () => {
  // Find the actual path of the report page on N11
  console.log('=== Finding report page on N11 ===');
  const path = await ssh(`find ${N11_PATH} -path "*/73-modules/page.tsx" 2>/dev/null | head -5`);
  console.log('Report page:', path || 'NOT FOUND');
  
  // Also search all nodes
  console.log('\n=== Finding on all nodes ===');
  await ssh('find /www/wwwroot -path "*/73-modules/page.tsx" 2>/dev/null | head -20');
  
  // Check what "73" content is on N11 report page
  console.log('\n=== N11 page current "73" references ===');
  await ssh(`grep -n "73" ${N11_PATH}/src/app/\\(dashboard\\)/reports/73-modules/page.tsx 2>/dev/null | head -10`);
  
  // Check Sidebar.tsx for "73"
  console.log('\n=== Sidebar.tsx "73" references on N11 ===');
  await ssh(`grep -n "73\\|وحدة" ${N11_PATH}/src/components/Sidebar.tsx 2>/dev/null | head -10`);
  
  // What component shows "+73 وحدة منظومة"?
  console.log('\n=== Search for "+73" or "وحدة منظومة" globally ===');
  await ssh(`grep -r "وحدة منظومة\\|\\+73" ${N11_PATH}/src/ 2>/dev/null | head -10`);
})();
