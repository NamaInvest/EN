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
  // 1. اعرف مسار login الحقيقي في N11
  console.log('=== Login page path in N11 ===');
  console.log(await ssh(`find ${N11}/src/app -name "page.tsx" | grep -iE "login|sign" 2>&1`));

  // 2. فحص صفحة login إذا موجودة
  console.log('\n=== Login page content head ===');
  console.log(await ssh(`head -20 ${N11}/src/app/login/page.tsx 2>&1`));

  // 3. فحص middleware بالكامل
  console.log('\n=== Middleware.ts ===');
  console.log(await ssh(`cat ${N11}/src/middleware.ts 2>&1`));

  // 4. اعرف الـ routes المبنية في .next
  console.log('\n=== Built routes manifest ===');
  console.log(await ssh(`cat ${N11}/.next/routes-manifest.json 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r['page']) for r in d.get('dynamicRoutes',[])+d.get('staticRoutes',[])]" 2>&1 | grep -iE "login|sign|auth" | head -10`));

  // 5. المشكلة الحقيقية: Nginx 403 على /
  // الحل: remove index directive conflict
  console.log('\n=== Fix: Update Nginx vhost to remove index conflict ===');
  
  // الـ vhost يحتوي index index.php index.html ... وهذا يتعارض مع الـ proxy
  // نضيف header خاص لتجاوز هذا
  const vhostPath = '/www/server/panel/vhost/nginx/n11.namainvist.com.conf';
  
  // backup
  await ssh(`cp ${vhostPath} ${vhostPath}.bak 2>&1`);
  
  // تعديل: حذف index directive أو تغييره لمنع تقديم static files
  await ssh(`sed -i 's/index index.php index.html index.htm default.php default.htm default.html;/index index.php;/' ${vhostPath} 2>&1`);
  
  console.log('✅ Removed index.html from Nginx index directive');

  // 6. إضافة redirect صريح من / إلى /login في proxy conf
  const redirectProxy = `location = / {
    return 302 /login;
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
}`;

  const proxyPath = '/www/server/panel/vhost/nginx/proxy/n11.namainvist.com/proxy.conf';
  await ssh(`printf '%s' '${redirectProxy.replace(/'/g, "'\\''")}' > ${proxyPath}`);
  console.log('✅ Updated proxy.conf with root redirect');

  // 7. اختبار nginx
  console.log('\n=== Nginx test ===');
  console.log(await ssh(`nginx -t 2>&1`));

  // 8. reload nginx
  console.log('\n=== Nginx reload ===');
  console.log(await ssh(`service nginx reload 2>&1`));

  await new Promise(r => setTimeout(r, 3000));

  // 9. اختبر login page عبر الدومين
  console.log('\n=== Test login via domain ===');
  console.log(await ssh(`curl -sk -o /dev/null -w "/ → %{http_code}" https://n11.namainvist.com/ 2>&1`));
  console.log(await ssh(`curl -sk -o /dev/null -w "/login → %{http_code}" https://n11.namainvist.com/login 2>&1`));
  console.log(await ssh(`curl -sk -L -o /dev/null -w "/login (follow) → %{http_code} final=%{url_effective}" https://n11.namainvist.com/ 2>&1`));
  
  // 10. اعرض ما يُرجعه /login
  console.log('\n=== Login page HTML preview ===');
  console.log(await ssh(`curl -sk https://n11.namainvist.com/login 2>&1 | grep -o '<title>[^<]*' | head -3`));
})();
