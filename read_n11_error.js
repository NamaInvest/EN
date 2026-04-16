const { Client } = require('ssh2');

function ssh(cmd, timeout = 30000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '\n[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR] ' + err.message); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {
  // اقرأ آخر build log للحصول على السطر الدقيق للخطأ
  console.log('\n=== Last build log - full error ===');
  const buildLog = await ssh(`tail -80 /tmp/n11_build.log 2>&1`);
  console.log(buildLog);

  // اقرأ الـ manufacturing orders route كاملاً
  console.log('\n=== Manufacturing orders route FULL ===');
  const ordersRoute = await ssh(`cat -n ${N11}/src/app/api/manufacturing/orders/route.ts 2>&1`);
  console.log(ordersRoute);
})();
