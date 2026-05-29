const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  // Read proxy config
  console.log('=== Proxy config ===');
  const proxy = await ssh('ls /www/server/panel/vhost/nginx/proxy/namainvist.com/ && cat /www/server/panel/vhost/nginx/proxy/namainvist.com/*.conf 2>&1 | head -40');
  console.log(proxy);
  
  // Find proxy_cache_path
  const cachePath = await ssh('grep -r "proxy_cache_path" /etc/nginx/ /www/server/panel/nginx/ 2>/dev/null | head -5');
  console.log('\nProxy cache path:', cachePath);
  
  // Check aaPanel cache setting
  const aapanel = await ssh('cat /www/server/panel/vhost/nginx/proxy/namainvist.com/*.conf 2>&1');
  console.log('\nFull proxy conf:', aapanel);
})();
