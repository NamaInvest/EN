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

// الإعدادات المحتملة لـ proxy conf في AAPanel
const proxyDir = '/www/server/panel/vhost/nginx/proxy/n11.namainvist.com';

const goodProxyConf = `location / {
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

(async () => {
  // تحقق من وجود مجلد الـ proxy configs
  console.log('=== Check proxy dir ===');
  console.log(await ssh(`ls /www/server/panel/vhost/nginx/proxy/ 2>&1`));

  console.log('\n=== Current N11 proxy conf ===');
  console.log(await ssh(`cat ${proxyDir}/proxy.conf 2>&1`));

  // تحقق من الـ Nginx vhost الرئيسي هل يتضمن الـ proxy
  console.log('\n=== Nginx vhost includes ===');
  console.log(await ssh(`grep -n "proxy\\|3011" /www/server/panel/vhost/nginx/n11.namainvist.com.conf 2>&1`));

  // أعد كتابة proxy conf بالمحتوى الصحيح
  console.log('\n=== Writing correct proxy conf ===');
  await ssh(`mkdir -p ${proxyDir} && printf '%s' '${goodProxyConf.replace(/'/g, "'\\''")}' > ${proxyDir}/proxy.conf`);
  console.log(await ssh(`cat ${proxyDir}/proxy.conf 2>&1`));

  // اختبار Nginx
  console.log('\n=== Nginx test ===');
  console.log(await ssh(`nginx -t 2>&1`));

  // إعادة تحميل Nginx
  console.log('\n=== Nginx reload ===');
  console.log(await ssh(`service nginx reload 2>&1 || nginx -s reload 2>&1`));

  await new Promise(r => setTimeout(r, 3000));

  // اختبار نهائي عبر IP مباشر
  console.log('\n=== Test via IP ===');
  console.log(await ssh(`curl -sI --resolve n11.namainvist.com:443:127.0.0.1 https://n11.namainvist.com/ 2>&1 | head -5`));
  
  console.log('\n=== Test via localhost:3011 ===');
  console.log(await ssh(`curl -s -o /dev/null -w "HTTP: %{http_code} Size: %{size_download}" http://localhost:3011/ 2>&1`));
  
  console.log('\n=== Test /login page ===');
  console.log(await ssh(`curl -s -o /dev/null -w "HTTP: %{http_code}" http://localhost:3011/login 2>&1`));
  
  console.log('\n=== Port 3011 listening ===');
  console.log(await ssh(`ss -tlpn | grep 3011 2>&1`));
  
  console.log('\n✅ N11 fix complete!');
})();
