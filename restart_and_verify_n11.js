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
  console.log('=== Checking if .next/BUILD_ID exists ===');
  console.log(await ssh(`cat ${N11}/.next/BUILD_ID 2>&1`));

  console.log('\n=== Restarting N11 PM2 ===');
  console.log(await ssh(`cd ${N11} && pm2 restart n11 2>&1`));
  
  // انتظر 8 ثواني لكي يبدأ السيرفر
  await new Promise(r => setTimeout(r, 8000));

  console.log('\n=== N11 HTTP Test ===');
  console.log(await ssh(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3011/ 2>&1`));

  console.log('\n=== PM2 Status ===');
  console.log(await ssh(`pm2 list 2>&1 | grep n11`));

  console.log('\n=== Last PM2 error (5 lines) ===');
  console.log(await ssh(`tail -5 /root/.pm2/logs/n11-error.log 2>&1`));

  // فحص Nginx proxy
  console.log('\n=== Nginx N11 Proxy Config ===');
  console.log(await ssh(`cat /www/server/panel/vhost/nginx/proxy/n11.namainvist.com/*.conf 2>&1`));
})();
