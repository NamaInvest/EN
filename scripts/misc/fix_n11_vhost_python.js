const { Client } = require('ssh2');

function ssh(cmd, timeout = 30000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR]'); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

const vhostPath = '/www/server/panel/vhost/nginx/n11.namainvist.com.conf';

(async () => {
  // اكتب الـ vhost عبر Python لتجنب مشاكل escape
  const pythonScript = `
import os

vhost = """server {
    listen 80;
    listen 443 ssl http2;
    server_name n11.namainvist.com;
    
    root /www/wwwroot/n11.namainvist.com;

    ssl_certificate    /www/server/panel/vhost/cert/n11.namainvist.com/fullchain.pem;
    ssl_certificate_key    /www/server/panel/vhost/cert/n11.namainvist.com/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000";
    error_page 497 https://$host$request_uri;

    location ~ \\\\.well-known {
        allow all;
    }

    location ~ ^/(\\\\.user.ini|\\\\.htaccess|\\\\.git|\\\\.env|\\\\.svn) {
        return 404;
    }

    location / {
        proxy_pass http://127.0.0.1:3011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 75;
    }

    access_log  /www/wwwlogs/n11.namainvist.com.log;
    error_log   /www/wwwlogs/n11.namainvist.com.error.log;
}"""

with open('${vhostPath}', 'w') as f:
    f.write(vhost)
print("Written successfully")
`;

  // حفظ script Python مؤقتاً وتشغيله
  await ssh(`cat > /tmp/write_vhost.py << 'PYEOF'\n${pythonScript}\nPYEOF`);
  console.log('=== Running Python vhost writer ===');
  console.log(await ssh(`python3 /tmp/write_vhost.py 2>&1`));

  // التحقق من المحتوى
  console.log('\n=== Vhost content (checking $ variables) ===');
  console.log(await ssh(`grep -n "proxy_set_header\\|proxy_pass" ${vhostPath}`));

  // اختبار Nginx
  console.log('\n=== Nginx test ===');
  const testResult = await ssh(`nginx -t 2>&1`);
  console.log(testResult);

  if (testResult.includes('successful')) {
    console.log('\n=== Nginx reload ===');
    await ssh(`service nginx reload 2>&1`);
    await new Promise(r => setTimeout(r, 3000));

    console.log('\n=== FINAL TEST ===');
    const r1 = await ssh(`curl -sk -o /dev/null -w "/ = %{http_code}" https://n11.namainvist.com/`);
    console.log(r1);
    const r2 = await ssh(`curl -sk -o /dev/null -w "/login = %{http_code}" https://n11.namainvist.com/login`);
    console.log(r2);
    
    // استخرج عنوان الصفحة للتأكد
    const title = await ssh(`curl -sk https://n11.namainvist.com/login 2>&1 | python3 -c "import sys,re; h=sys.stdin.read(); t=re.search(r'<title>(.*?)</title>',h,re.S); print(t.group(1)[:100] if t else 'No title')" 2>&1`);
    console.log('\nLogin page title:', title);
  }
})();
