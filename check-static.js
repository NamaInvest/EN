const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmd = [
    'echo "=== Static index files ==="',
    'find /www/wwwroot/namainvist.com -maxdepth 2 -name "index.html" -o -name "index.htm" 2>/dev/null',
    'echo ""',
    'echo "=== .next/server/app/ contents ==="',
    'ls /www/wwwroot/namainvist.com/.next/server/app/ 2>/dev/null',
    'echo ""',
    'echo "=== Root webroot files ==="',
    'ls /www/wwwroot/namainvist.com/ | grep -v node_modules | head -15',
    'echo ""',
    'echo "=== next.config.js output ==="',
    'grep -i "output\\|export" /www/wwwroot/namainvist.com/next.config.js 2>/dev/null | head -5',
    'echo ""',
    'echo "=== Nginx try_files (static serving) ==="',
    'grep -n "try_files\\|index " /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null',
    'echo ""',
    'echo "=== site_total.conf ==="',
    'cat /www/server/panel/vhost/nginx/extension/namainvist.com/site_total.conf 2>/dev/null',
    'echo ""',
    'echo "=== Does index.html exist at webroot? ==="',
    'ls -la /www/wwwroot/namainvist.com/index.html 2>/dev/null || echo "NOT FOUND"',
    'ls -la /www/wwwroot/namainvist.com/public/index.html 2>/dev/null || echo "public/index.html NOT FOUND"',
  ].join(' && ');

  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => { c.end(); });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
