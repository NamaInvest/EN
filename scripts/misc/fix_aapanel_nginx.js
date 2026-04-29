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

// AAPanel nginx - هذا هو الـ nginx الفعلي
const PANEL_VHOST = '/www/server/panel/vhost/nginx/n11.namainvist.com.conf';
const PANEL_NGINX = '/www/server/nginx/sbin/nginx';
const PANEL_NGINX_CONF = '/www/server/nginx/conf/nginx.conf';

(async () => {
  // 1. فحص الـ vhost الحالي في AAPanel  
  console.log('=== Current AAPanel nginx.conf ===');
  console.log(await ssh(`cat ${PANEL_NGINX_CONF} 2>&1 | grep -n "include.*vhost\|include.*sites" | head -5`));

  console.log('\n=== AAPanel vhost for N11 ===');
  console.log(await ssh(`cat ${PANEL_VHOST} 2>&1`));

  // 2. تعديل proxy conf في AAPanel nginx - هذا هو الصحيح
  // المشكلة: الـ proxy/*.conf يُضاف في منتصف الـ vhost لكن PHP config يتغلب عليه
  console.log('\n=== AAPanel proxy conf for N11 ===');
  console.log(await ssh(`cat /www/server/panel/vhost/nginx/proxy/n11.namainvist.com/proxy.conf 2>&1`));

  // 3. اعرض كيف يتضمن الـ AAPanel vhost الـ proxy
  console.log('\n=== AAPanel enable-php.conf ===');
  console.log(await ssh(`cat /www/server/nginx/conf/enable-php.conf 2>&1`));

  // 4. الحل: تعديل الـ AAPanel vhost لإزالة PHP inclusion والتأكد من الـ proxy يأتي أولاً
  // اكتب vhost جديد يعتمد فقط على الـ proxy
  const pythonScript = `
content = open('${PANEL_VHOST}').read()
print("=== ORIGINAL VHOST ===")
print(content)
`;
  
  console.log('\n=== Reading original AAPanel vhost ===');
  await ssh(`python3 << 'PYEOF'\n${pythonScript}\nPYEOF`);
  
  // 5. كتابة vhost جديد مباشرة في AAPanel
  const newPanelVhost = `server
{
    listen 80;
    listen 443 ssl http2 ;
    server_name n11.namainvist.com;
    root /www/wwwroot/n11.namainvist.com;

    #CERT-APPLY-CHECK--START
    include /www/server/panel/vhost/nginx/well-known/n11.namainvist.com.conf;
    #CERT-APPLY-CHECK--END

    #SSL-START
    ssl_certificate    /www/server/panel/vhost/cert/n11.namainvist.com/fullchain.pem;
    ssl_certificate_key    /www/server/panel/vhost/cert/n11.namainvist.com/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000";
    error_page 497  https://$host$request_uri;
    #SSL-END

    location ~ /purge(/.*) {
        proxy_cache_purge cache_one $host$1$is_args$args;
    }

    location ~ ^/(\\\.user.ini|\\\.htaccess|\\\.git|\\\.env|\\\.svn|\\\.project|LICENSE|README.md)
    {
        return 404;
    }

    location ~ \\\\.well-known{
        allow all;
    }

    # MAIN PROXY - Route all to Next.js
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
    error_log  /www/wwwlogs/n11.namainvist.com.error.log;
}`;

  const writePy = `
vhost = """${newPanelVhost}"""
with open('${PANEL_VHOST}', 'w') as f:
    f.write(vhost)
print("Written!")
`;

  console.log('\n=== Writing new AAPanel vhost ===');
  console.log(await ssh(`python3 << 'PYEOF'\n${writePy}\nPYEOF`));

  // 6. اختبار AAPanel nginx
  console.log('\n=== Test AAPanel nginx ===');
  console.log(await ssh(`${PANEL_NGINX} -t -c ${PANEL_NGINX_CONF} 2>&1`));

  // 7. إعادة تشغيل AAPanel nginx
  console.log('\n=== Reload AAPanel nginx ===');
  console.log(await ssh(`${PANEL_NGINX} -s reload -c ${PANEL_NGINX_CONF} 2>&1 || /etc/init.d/nginx reload 2>&1`));

  await new Promise(r => setTimeout(r, 3000));

  // 8. اختبار نهائي
  console.log('\n=== FINAL TEST ===');
  console.log(await ssh(`curl -sk -o /dev/null -w "/ = %{http_code}" https://n11.namainvist.com/`));
  console.log(await ssh(`curl -sk -o /dev/null -w "/login = %{http_code}" https://n11.namainvist.com/login`));
  
  const title = await ssh(`curl -sk https://n11.namainvist.com/login 2>&1 | python3 -c "import sys,re; h=sys.stdin.read(); t=re.search(r'<title>(.*?)</title>',h,re.S); print(t.group(1)[:80] if t else 'No title')" 2>&1`);
  console.log('\nPage title:', title);

  console.log('\n=== Nginx error log ===');
  console.log(await ssh(`tail -5 /www/wwwlogs/n11.namainvist.com.error.log 2>&1`));
})();
