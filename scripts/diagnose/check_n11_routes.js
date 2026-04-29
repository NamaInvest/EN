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
  // 1. فحص مسارات الصفحات في N11
  console.log('=== N11 app pages ===');
  console.log(await ssh(`find ${N11}/src/app -name "page.tsx" ! -path "*/api/*" 2>&1 | grep -v dashboard | head -20`));

  // 2. فحص الـ Next.js out log لمعرفة ماذا يعيد
  console.log('\n=== What does N11 server return on / ===');
  console.log(await ssh(`curl -v http://localhost:3011/ 2>&1 | head -30`));

  // 3. الصفحة الرئيسية لـ N11 أين هي؟
  console.log('\n=== N11 root page ===');
  console.log(await ssh(`ls ${N11}/src/app/ 2>&1`));

  // 4. فحص middleware - هل يعيد redirect من / إلى /login؟
  console.log('\n=== Middleware redirect check ===');
  console.log(await ssh(`curl -v http://localhost:3011/ 2>&1 | grep -E "location:|< HTTP|> GET"`));

  // 5. فحص pages أكثر
  console.log('\n=== Direct test on known pages ===');
  for (const path of ['/login', '/dashboard', '/pos', '/sales']) {
    const res = await ssh(`curl -s -o /dev/null -w "${path}: %{http_code}" http://localhost:3011${path} 2>&1`);
    console.log(res);
  }
})();
