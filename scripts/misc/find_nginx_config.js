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

(async () => {
  // 1. اعرف كيف يتضمن Nginx الـ configs
  console.log('=== /etc/nginx/nginx.conf includes ===');
  console.log(await ssh(`grep -n "include" /etc/nginx/nginx.conf 2>&1`));
  
  // 2. فحص كيف يتضمن الـ panel conf
  console.log('\n=== Panel nginx main conf ===');
  console.log(await ssh(`cat /www/server/nginx/conf/nginx.conf 2>&1 | grep -n "include" | head -15`));
  
  // 3. أهم سؤال: ما هو الـ nginx المشغّل أصلاً؟
  console.log('\n=== Which nginx binary is running ===');
  console.log(await ssh(`which nginx && nginx -v 2>&1`));
  console.log(await ssh(`ls -la /usr/sbin/nginx /www/server/nginx/sbin/nginx 2>&1`));

  // 4. ما هو الـ main config file؟
  console.log('\n=== Main nginx.conf location ===');
  console.log(await ssh(`nginx -t 2>&1 | head -5`));
  console.log(await ssh(`ps aux | grep nginx | head -3`));
  
  // 5. قرأ كيف يتضمن الـ vhosts
  console.log('\n=== nginx.conf vhost includes ===');
  console.log(await ssh(`cat /www/server/nginx/conf/nginx.conf 2>&1 | grep -A2 "vhost\|sites"`));
})();
