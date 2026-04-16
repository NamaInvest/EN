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
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';
const vhostPath = '/www/server/panel/vhost/nginx/n11.namainvist.com.conf';

// الحل: كتابة ملف vhost جديد كامل يحل محل الإعدادات السابقة
// هذا الـ vhost الصحيح يوجه كل الطلبات لـ Node.js على 3011

const newVhost = `server {
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

    # Well-known for SSL renewal
    location ~ \\.well-known {
        allow all;
    }
    
    # Block sensitive files
    location ~ ^/(\\.user.ini|\\.htaccess|\\.git|\\.env|\\.svn) {
        return 404;
    }

    # Proxy all to Next.js
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
}`;

(async () => {
  console.log('=== Backup old vhost ===');
  console.log(await ssh(`cp ${vhostPath} ${vhostPath}.bak2 && echo "Backed up"`));

  console.log('\n=== Write new clean vhost ===');
  // كتابة الـ vhost الجديد بطريقة آمنة
  const lines = newVhost.split('\n');
  await ssh(`truncate -s 0 ${vhostPath}`);
  for (const line of lines) {
    const escaped = line.replace(/'/g, "'\\''").replace(/\$/g, '\\$');
    await ssh(`echo '${escaped}' >> ${vhostPath}`);
  }
  console.log('✅ New vhost written');
  
  console.log('\n=== New vhost content ===');
  console.log(await ssh(`cat ${vhostPath}`));

  console.log('\n=== Nginx test ===');
  const testResult = await ssh(`nginx -t 2>&1`);
  console.log(testResult);

  if (testResult.includes('successful')) {
    console.log('\n=== Nginx reload ===');
    console.log(await ssh(`service nginx reload 2>&1`));

    await new Promise(r => setTimeout(r, 3000));

    console.log('\n=== Final test ===');
    console.log(await ssh(`curl -sk -o /dev/null -w "/ = %{http_code}" https://n11.namainvist.com/`));
    console.log(await ssh(`curl -sk -o /dev/null -w "/login = %{http_code}" https://n11.namainvist.com/login`));
    
    const loginTitle = await ssh(`curl -sk https://n11.namainvist.com/login 2>&1 | python3 -c "import sys,re; h=sys.stdin.read(); t=re.search(r'<title>(.*?)</title>',h); print(t.group(1) if t else 'No title')" 2>&1`);
    console.log('\nLogin page title:', loginTitle);
  } else {
    console.log('⚠️ Nginx config test failed, reverting...');
    await ssh(`cp ${vhostPath}.bak2 ${vhostPath}`);
  }
})();
