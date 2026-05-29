const { Client } = require('ssh2');

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

(async () => {
  // Read the .htaccess
  console.log('=== .htaccess ===');
  await ssh('cat /www/wwwroot/namainvist.com/.htaccess');
  
  // Read next.config.ts - might have output dir setting
  console.log('\n=== next.config.ts ===');
  await ssh('cat /www/wwwroot/namainvist.com/next.config.ts');
  
  // Check if there's an "out" or "export" directory
  console.log('\n=== Check for static export ===');
  await ssh('ls /www/wwwroot/namainvist.com/out/ 2>/dev/null | head -10 || echo "no out dir"');
  
  // What page does nginx ACTUALLY serve? Let's see the nginx -T output for this domain
  console.log('\n=== Complete compiled nginx config ===');
  await ssh('nginx -T 2>/dev/null | grep -A 100 "namainvist.com" | head -80');
})();
