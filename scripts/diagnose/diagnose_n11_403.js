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

const vhostPath = '/www/server/panel/vhost/nginx/n11.namainvist.com.conf';

(async () => {
  // 1. اختبر Nginx مباشرة بدون Cloudflare
  console.log('=== Direct IP test (bypass Cloudflare) ===');
  console.log(await ssh(`curl -sk -H "Host: n11.namainvist.com" -o /dev/null -w "/ = %{http_code}" http://46.4.188.170/`));
  console.log(await ssh(`curl -sk -H "Host: n11.namainvist.com" -o /dev/null -w "/login = %{http_code}" http://46.4.188.170/login`));

  // 2. اعرض الـ vhost الفعلي الذي يقرأه Nginx
  console.log('\n=== ACTUAL loaded vhost ===');
  console.log(await ssh(`nginx -T 2>&1 | grep -A 50 "n11.namainvist.com" | head -60`));

  // 3. فحص مجلدات nginx الأخرى التي قد تحتوي على vhost آخر
  console.log('\n=== All nginx conf files mentioning n11 ===');
  console.log(await ssh(`find /etc/nginx /www/server -name "*.conf" -exec grep -l "n11.namainvist" {} \\; 2>&1`));

  // 4. فحص ما إذا كان Cloudflare يسبب الـ 403
  console.log('\n=== Check Nginx access log for n11 ===');
  console.log(await ssh(`tail -10 /www/wwwlogs/n11.namainvist.com.log 2>&1`));
  console.log('\n=== Nginx error log ===');
  console.log(await ssh(`tail -5 /www/wwwlogs/n11.namainvist.com.error.log 2>&1`));
})();
