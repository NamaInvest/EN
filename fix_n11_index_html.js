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

(async () => {
  // 1. اعرض محتوى مجلد N11 الجذر
  console.log('=== Root directory files ===');
  console.log(await ssh(`ls -la ${N11}/ | grep -E "\.html$|index"`));

  // 2. احذف index.html الافتراضي
  console.log('\n=== Removing default index.html ===');
  console.log(await ssh(`rm -f ${N11}/index.html 2>&1 && echo "Removed" || echo "Not found"`));

  // 3. اعرض Nginx vhost كاملاً لفهم ترتيب الـ directives
  console.log('\n=== Full Nginx vhost config ===');
  console.log(await ssh(`cat /www/server/panel/vhost/nginx/n11.namainvist.com.conf 2>&1`));

  // 4. اعرض proxy conf الحالي
  console.log('\n=== Proxy conf ===');
  console.log(await ssh(`cat /www/server/panel/vhost/nginx/proxy/n11.namainvist.com/proxy.conf 2>&1`));

  // 5. إصلاح proxy.conf بإضافة try_files لـ Next.js
  const fixedProxy = `location / {
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
}`;

  await ssh(`printf '%s\\n' '${fixedProxy.replace(/'/g, "'\\''")}' > /www/server/panel/vhost/nginx/proxy/n11.namainvist.com/proxy.conf`);
  console.log('\n✅ proxy.conf updated');

  // 6. هل يوجد include-php أو enable-php في الـ vhost يتعارض مع الـ proxy؟
  console.log('\n=== Check for PHP config conflicts ===');
  console.log(await ssh(`cat /www/server/panel/vhost/nginx/enable-php-00.conf 2>&1 | head -20`));

  // 7. اختبار Nginx
  console.log('\n=== Nginx test ===');
  console.log(await ssh(`nginx -t 2>&1`));

  // 8. إعادة تشغيل Nginx
  console.log('\n=== Nginx reload ===');
  console.log(await ssh(`service nginx reload 2>&1`));
  await new Promise(r => setTimeout(r, 3000));

  // 9. اختبار نهائي
  console.log('\n=== Final test - HTTP via domain ===');
  console.log(await ssh(`curl -sk -o /dev/null -w "Status:%{http_code} Size:%{size_download}" https://n11.namainvist.com/login 2>&1`));
  
  console.log('\n=== Final test - HTTP via localhost ===');
  console.log(await ssh(`curl -s -o /dev/null -w "Status:%{http_code}" http://localhost:3011/login 2>&1`));

  console.log('\n=== Check what the page returns ===');
  console.log(await ssh(`curl -sk https://n11.namainvist.com/ 2>&1 | head -5`));
})();
