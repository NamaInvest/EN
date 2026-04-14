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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

(async () => {
  // The aaPanel nginx serves namainvist.com through a DIFFERENT mechanism
  // Let's find the actual aaPanel configured vhost
  
  // Check aaPanel vhosts file
  console.log('=== aaPanel vhost configs for namainvist ===');
  await ssh('cat /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null | head -60');
  
  // Check nginx test on the aaPanel config
  console.log('\n=== Nginx test ===');
  await ssh('nginx -t 2>&1');
  
  // Actually curl the site with verbose headers
  console.log('\n=== Curl with headers ===');
  await ssh('curl -sI https://namainvist.com/ 2>/dev/null | head -20');
  
  // Check if proxy.conf was properly loaded
  console.log('\n=== Nginx config includes for namainvist ===');
  await ssh('grep -r "2999\\|namainvist" /etc/nginx/ /www/server/panel/vhost/nginx/ 2>/dev/null | grep -v ".swp" | head -20');
})();
