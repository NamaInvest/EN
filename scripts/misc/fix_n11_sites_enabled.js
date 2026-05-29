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

(async () => {
  // 1. افحص /etc/nginx/sites-enabled/ - الـ vhost الفعلي الذي يُطبَّق
  console.log('=== /etc/nginx/sites-enabled/ content ===');
  console.log(await ssh(`ls /etc/nginx/sites-enabled/ 2>&1`));

  console.log('\n=== The ACTUAL active vhost ===');
  console.log(await ssh(`cat /etc/nginx/sites-enabled/n11.namainvist.com 2>&1`));

  // 2. المشكلة: هذا الـ vhost الفعلي لا يحتوي root, لكن الـ location / لا يعمل صح
  // الحل: تحديث /etc/nginx/sites-enabled/ مباشرة

  const pythonFix = `
vhost = """server {
    listen 80;
    listen 443 ssl http2;
    server_name n11.namainvist.com;

    ssl_certificate /etc/ssl/namainvist/origin.crt;
    ssl_certificate_key /etc/ssl/namainvist/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 75;
    }
}"""

with open('/etc/nginx/sites-enabled/n11.namainvist.com', 'w') as f:
    f.write(vhost)
print("Done")
`;

  await ssh(`python3 - << 'PYEOF'\n${pythonFix}\nPYEOF`);
  console.log('\n✅ Updated /etc/nginx/sites-enabled/n11.namainvist.com');

  console.log('\n=== Verify new content ===');
  console.log(await ssh(`cat /etc/nginx/sites-enabled/n11.namainvist.com 2>&1`));

  console.log('\n=== Nginx test ===');
  console.log(await ssh(`nginx -t 2>&1`));

  console.log('\n=== Nginx reload ===');
  await ssh(`service nginx reload 2>&1`);

  await new Promise(r => setTimeout(r, 3000));

  console.log('\n=== FINAL TEST ===');
  console.log(await ssh(`curl -sk -o /dev/null -w "/ = %{http_code}" http://46.4.188.170/ -H "Host: n11.namainvist.com"`));
  console.log(await ssh(`curl -sk -o /dev/null -w "/login = %{http_code}" http://46.4.188.170/login -H "Host: n11.namainvist.com"`));
  
  const title = await ssh(`curl -sk https://n11.namainvist.com/login 2>&1 | python3 -c "import sys,re; h=sys.stdin.read(); t=re.search(r'<title>(.*?)</title>',h,re.S); print(t.group(1)[:80] if t else 'No title')" 2>&1`);
  console.log('\nLogin page title:', title);
  
  console.log('\n=== Error log after fix ===');
  console.log(await ssh(`tail -5 /www/wwwlogs/n11.namainvist.com.error.log 2>&1`));
})();
