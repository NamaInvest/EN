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

(async () => {
  // 1. ما هو محتوى page.tsx الجذري في N11؟
  console.log('=== N11 root page.tsx ===');
  console.log(await ssh(`head -30 ${N11}/src/app/page.tsx 2>&1`));

  // 2. مشكلة redirect - N11 page.tsx ترسل redirect لـ namainvist.com
  // الحل: /login يعطي 404 لأن middleware يوجه N11 requests للـ login

  // 3. فحص Nginx permissions على مجلد N11
  console.log('\n=== N11 directory permissions ===');
  console.log(await ssh(`ls -la /www/wwwroot/ | grep n11`));

  // 4. تعيين إذونات صحيحة
  await ssh(`chmod 755 ${N11} 2>&1`);
  console.log('✅ Fixed N11 directory permissions');

  // 5. هل يوجد .htaccess يسبب مشكلة؟
  console.log('\n=== .htaccess content ===');
  console.log(await ssh(`cat ${N11}/.htaccess 2>&1`));

  // 6. فحص Nginx error log
  console.log('\n=== Nginx error log last 10 lines ===');
  console.log(await ssh(`tail -10 /www/wwwlogs/n11.namainvist.com.error.log 2>&1`));

  // 7. reload nginx
  await ssh(`service nginx reload 2>&1`);
  await new Promise(r => setTimeout(r, 2000));

  // 8. اختبار مباشر بهيدر Host صحيح
  console.log('\n=== Test with correct Host header ===');
  console.log(await ssh(`curl -sk -H "Host: n11.namainvist.com" -o /dev/null -w "/ = %{http_code}" http://localhost/ 2>&1`));
  console.log(await ssh(`curl -sk -H "Host: n11.namainvist.com" -o /dev/null -w "/login = %{http_code}" http://localhost/login 2>&1`));
  
  // 9. اختبار مع SSL passthrough
  console.log('\n=== External test ===');
  console.log(await ssh(`curl -sk -L -o /dev/null -w "Result: %{http_code} | Final URL: %{url_effective}" https://n11.namainvist.com/ 2>&1`));
  console.log(await ssh(`curl -sk -o /dev/null -w "/login: %{http_code}" https://n11.namainvist.com/login 2>&1`));

  // 10. HTML title للـ login page
  const title = await ssh(`curl -sk https://n11.namainvist.com/login | python3 -c "import sys; html=sys.stdin.read(); import re; t=re.search(r'<title>(.*?)</title>', html); print(t.group(1) if t else 'No title found')" 2>&1`);
  console.log('\nLogin page title:', title);
})();
