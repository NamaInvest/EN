const { Client } = require('ssh2');

function ssh(host, cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

// N11 is on the main server at port 3011
(async () => {
  const SERVER = '46.4.188.170';
  
  // Check what's actually rendering on N11 (what the compiled chunk contains)
  console.log('=== N11 compiled page chunk - content check ===');
  await ssh(SERVER, 'find /www/wwwroot/n11.namainvist.com/.next/server/chunks/ssr/ -name "*.js" 2>/dev/null | xargs grep -l "MODULES_DATA\\|modulesList\\|104 وحدة" 2>/dev/null | head -5');
  
  // Check if the 73-modules page is a client or server component in the build
  console.log('\n=== N11 73-modules page compiled output ===');
  await ssh(SERVER, 'find /www/wwwroot/n11.namainvist.com/.next -path "*73-modules*" 2>/dev/null | head -10');
  
  // Check N11 source file state
  console.log('\n=== N11 source file lines ===');
  await ssh(SERVER, 'wc -l /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/reports/73-modules/page.tsx');
  
  // Rebuild N11
  console.log('\n=== Rebuilding N11 ===');
  await ssh(SERVER, 'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -15');
  
  await ssh(SERVER, 'pm2 restart n11 2>&1 | tail -2');
  
  // Verify compiled chunk now has new content
  console.log('\n=== Verify new build has 104 modules ===');
  await ssh(SERVER, 'find /www/wwwroot/n11.namainvist.com/.next/server/chunks/ssr/ -name "*.js" 2>/dev/null | xargs grep -l "MODULES_DATA\\|104 وحدة" 2>/dev/null | head -5');
  
  console.log('\n✅ N11 rebuilt successfully!');
})();
