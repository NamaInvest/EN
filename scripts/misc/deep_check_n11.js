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
  // 1. افحص N11 PM2 process - هل هو فعلاً يعمل؟
  console.log('=== N11 PM2 Check ===');
  console.log(await ssh(`pm2 describe 3 2>&1 | grep -E "status|pid|uptime|cwd|script"`));

  // 2. اختبر مباشرة على port 3011
  console.log('\n=== Direct port test ===');
  console.log(await ssh(`curl -v http://localhost:3011/ 2>&1 | head -30`));

  // 3. افحص أي process يستمع على 3011
  console.log('\n=== What is listening on 3011 ===');
  console.log(await ssh(`ss -tlpn | grep 3011`));
  console.log(await ssh(`lsof -i :3011 2>&1 | head -10`));
  
  // 4. PM2 out log
  console.log('\n=== PM2 Out Log (last 20) ===');
  console.log(await ssh(`tail -20 /root/.pm2/logs/n11-out.log 2>&1`));

  // 5. PM2 Error Log
  console.log('\n=== PM2 Error Log (last 20) ===');
  console.log(await ssh(`tail -20 /root/.pm2/logs/n11-error.log 2>&1`));
})();
