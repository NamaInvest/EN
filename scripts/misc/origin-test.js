const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmd = `
    echo "=== Compare origin response: / vs /?v=123 ==="
    
    # Test root path directly via Next.js (port 2999)
    SIZE_ROOT=$(curl -s http://localhost:2999/ 2>/dev/null | wc -c)
    SIZE_QS=$(curl -s "http://localhost:2999/?v=123" 2>/dev/null | wc -c)
    echo "Port 2999 / size: $SIZE_ROOT bytes"
    echo "Port 2999 /?v=123 size: $SIZE_QS bytes"
    
    # Test via Nginx (port 80/443 with Host header)
    SIZE_NGINX_ROOT=$(curl -s -H "Host: namainvist.com" http://localhost:80/ 2>/dev/null | wc -c)
    SIZE_NGINX_QS=$(curl -s -H "Host: namainvist.com" "http://localhost:80/?v=123" 2>/dev/null | wc -c)
    echo ""
    echo "Nginx port 80 / size: $SIZE_NGINX_ROOT bytes"
    echo "Nginx port 80 /?v=123 size: $SIZE_NGINX_QS bytes"
    
    # Check what nginx actually sends back
    echo ""
    echo "=== Nginx response headers for / ==="
    curl -sI -H "Host: namainvist.com" http://localhost:80/ 2>/dev/null | grep -i "content-type\\|content-length\\|server\\|x-nextjs\\|cache"
    
    echo ""
    echo "=== Content of first 500 chars from Nginx / ==="
    curl -s -H "Host: namainvist.com" http://localhost:80/ 2>/dev/null | head -c 600
    
    echo ""
    echo ""
    echo "=== .next/server/app/page directory contents ==="
    ls -la /www/wwwroot/namainvist.com/.next/server/app/page/ 2>/dev/null || echo "page/ dir doesn't exist OR"
    ls -la /www/wwwroot/namainvist.com/.next/server/app/page.html 2>/dev/null || echo "page.html doesn't exist"
    
    echo ""
    echo "=== Full nginx site config ==="
    cat /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null | grep -v "^#" | grep -v "^$" | head -50
  `;
  
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write('[ERR] ' + d.toString()));
    stream.on('close', () => { c.end(); });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
