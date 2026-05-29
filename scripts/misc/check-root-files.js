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
  // Check root folder for static html files
  console.log('=== Root files in namainvist.com ===');
  await ssh('ls -la /www/wwwroot/namainvist.com/ | head -30');
  
  // Check if there is an index.html in root
  console.log('\n=== index.html in root? ===');
  await ssh('ls -la /www/wwwroot/namainvist.com/index.html /www/wwwroot/namainvist.com/index.htm /www/wwwroot/namainvist.com/index.php 2>/dev/null || echo "No static index found in root"');
  
  // Check if there is a public/ directory
  console.log('\n=== public/ directory? ===');
  await ssh('ls /www/wwwroot/namainvist.com/public/ 2>/dev/null | head -10 || echo "no public dir"');
  
  // What does nginx actually serve when a request comes in?
  // nginx config has: index index.php index.html index.htm default.php default.htm default.html;
  // root /www/wwwroot/namainvist.com;
  // This means BEFORE the proxy, it looks for static files
  
  // The proxy config location / should override this... let's verify
  console.log('\n=== Check current proxy config ===');
  await ssh('cat /www/server/panel/vhost/nginx/proxy/namainvist.com/proxy.conf 2>/dev/null');
  
  // The issue: nginx config has these directives before proxy:
  // index index.php index.html ...
  // root /www/wwwroot/namainvist.com
  // And location / in proxy overrides... but there might be a DEFAULT location block
  
  // Let's check if proxy location has higher priority
  // Solution: delete any index.html from root
  console.log('\n=== Delete any static index.html from root ===');
  await ssh('rm -f /www/wwwroot/namainvist.com/index.html /www/wwwroot/namainvist.com/index.htm /www/wwwroot/namainvist.com/index.php 2>/dev/null && echo "OK"');
  
  // Also check if nginx is using try_files which bypasses proxy
  console.log('\n=== Full nginx config with location blocks ===');
  await ssh('nginx -T 2>/dev/null | grep -A 50 "server_name namainvist" | head -60');
})();
