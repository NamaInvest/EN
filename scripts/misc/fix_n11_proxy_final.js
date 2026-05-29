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

const N11 = '/www/wwwroot/n11.namainvist.com';

// المشكلة: /login يعطي 404 لأن Nginx يعترض ويرجع 404.html
// الحل: تجاوز Nginx error_page 404 وتوجيه كل شيء للـ Node.js

const finalProxyConf = `location / {
    proxy_pass http://127.0.0.1:3011;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \\$scheme;
    proxy_cache_bypass \\$http_upgrade;
    proxy_read_timeout 300;
    proxy_connect_timeout 75;
    proxy_intercept_errors off;
}`;

(async () => {
  const proxyPath = '/www/server/panel/vhost/nginx/proxy/n11.namainvist.com/proxy.conf';
  const vhostPath = '/www/server/panel/vhost/nginx/n11.namainvist.com.conf';

  // 1. حذف error_page 404 من الـ vhost (يمنع Nginx من إرجاع 404.html)
  console.log('=== Remove 404 error_page from vhost ===');
  await ssh(`sed -i 's/error_page 404 \\/404.html;//' ${vhostPath}`);
  console.log('✅ Removed 404 override from vhost');

  // 2. تحديث proxy conf
  console.log('\n=== Update proxy.conf ===');
  await ssh(`cat > ${proxyPath} << 'PROXYEOF'
location / {
    proxy_pass http://127.0.0.1:3011;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300;
    proxy_connect_timeout 75;
    proxy_intercept_errors off;
}
PROXYEOF`);
  console.log('✅ Proxy conf updated');
  console.log(await ssh(`cat ${proxyPath}`));

  // 3. إزالة root directive أو تغييره لأمنع تقديم ملفات ثابتة
  // إضافة internal directive على ملفات الـ html
  console.log('\n=== Nginx test ===');
  console.log(await ssh(`nginx -t 2>&1`));

  console.log('\n=== Nginx reload ===');
  console.log(await ssh(`service nginx reload 2>&1`));

  await new Promise(r => setTimeout(r, 3000));

  // 4. اختبار
  console.log('\n=== Test results ===');
  console.log(await ssh(`curl -sk -o /dev/null -w "/ = %{http_code}" https://n11.namainvist.com/`));
  console.log(await ssh(`curl -sk -o /dev/null -w "/login = %{http_code}" https://n11.namainvist.com/login`));
  console.log(await ssh(`curl -sk -o /dev/null -w "/dashboard = %{http_code}" https://n11.namainvist.com/dashboard`));
  
  // 5. اعرض title صفحة login
  console.log('\n=== Login page title ===');
  const loginHtml = await ssh(`curl -sk https://n11.namainvist.com/login 2>&1 | grep -o '<title>[^<]*'`);
  console.log(loginHtml);

  console.log('\n✅ Done!');
})();
