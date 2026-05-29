const { Client } = require('ssh2');

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

(async () => {
  // Check extension config for namainvist.com
  console.log('=== Nginx extension configs ===');
  const r1 = await ssh('ls /www/server/panel/vhost/nginx/extension/namainvist.com/ 2>/dev/null && cat /www/server/panel/vhost/nginx/extension/namainvist.com/*.conf 2>/dev/null');
  console.log(r1 || 'No extension configs');
  
  // What port does main-site run on?
  console.log('\n=== PM2 main-site details ===');
  const r2 = await ssh('pm2 show main-site 2>/dev/null | grep -E "port|script|cwd|pid"');
  console.log(r2);
  
  // What is actually listening on the port?
  const r3 = await ssh('pm2 show main-site 2>&1 | grep "script args"');
  console.log('\nScript args:', r3);
  
  // curl the actual port directly (bypass nginx)
  const r4 = await ssh('pm2 show main-site 2>&1 | grep "2999\\|3000\\|3001"');
  console.log('\nPort check:', r4);
  
  // Try curling directly
  const r5 = await ssh('curl -s http://localhost:2999/ 2>/dev/null | grep -o "73 قسم\\|104 وحدة\\|نظام مؤسسي" | head -5');
  console.log('\nDirect port 2999 response:', r5 || 'empty');
  
  const r6 = await ssh('curl -s http://localhost:3000/ 2>/dev/null | grep -o "73 قسم\\|104 وحدة\\|نظام مؤسسي" | head -5');
  console.log('Direct port 3000 response:', r6 || 'empty');
  
  // Find which port namainvist.com proxies to  
  const r7 = await ssh('cat /www/server/panel/vhost/nginx/extension/namainvist.com/*.conf 2>/dev/null || find /etc/nginx /www/server -name "*.conf" 2>/dev/null | xargs grep -l "namainvist.com" 2>/dev/null | head -5');
  console.log('\nRelated nginx configs:', r7);
})();
