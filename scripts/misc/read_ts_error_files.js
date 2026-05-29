const { Client } = require('ssh2');

function ssh(cmd, timeout = 60000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '\n[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR] ' + err.message); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {
  // اقرأ الملفات المتأثرة بالأخطاء
  const files = [
    `${N11}/src/app/api/reports/[type]/route.ts`,
    `${N11}/src/app/api/salaries/route.ts`,
    `${N11}/src/app/api/smart-transfers/route.ts`,
    `${N11}/src/app/api/vacations/route.ts`,
    `${N11}/src/app/api/sales/targets/route.ts`,
    `${N11}/src/app/api/stock/adjustments/route.ts`,
    `${N11}/src/app/api/stock/movements/route.ts`,
    `${N11}/src/app/api/purchases/route.ts`,
    `${N11}/src/app/api/recurring-invoices/route.ts`,
    `${N11}/src/lib/qz.ts`,
    `${N11}/src/lib/api-handler.ts`,
    `${N11}/src/app/api/sales-orders/route.ts`,
    `${N11}/src/app/api/tenant/provision/route.ts`,
  ];

  for (const f of files) {
    const name = f.replace(N11, '');
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`FILE: ${name}`);
    console.log('─'.repeat(60));
    console.log(await ssh(`cat "${f}" 2>&1`));
  }
})();
