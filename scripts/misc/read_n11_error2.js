const { Client } = require('ssh2');

function ssh(cmd, timeout = 60000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '\n[TIMEOUT]'); }, timeout);
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
  // قراءة كاملة للـ GET function (السطور 1-30)
  console.log('=== GET function in orders/route.ts ===');
  console.log(await ssh(`head -30 ${N11}/src/app/api/manufacturing/orders/route.ts`));

  // قراءة build log للعثور على الخطأ الدقيق
  console.log('\n=== Build Log - Error Section ===');
  console.log(await ssh(`grep -A 20 "Unknown field\\|PrismaClientValidation\\|Error\\|error" /tmp/n11_build.log | head -60`));

  // فحص ManufacturingOrder في الـ schema بدقة
  console.log('\n=== ManufacturingOrder schema definition ===');
  console.log(await ssh(`awk '/^model ManufacturingOrder/,/^}/' ${N11}/prisma/schema.prisma`));
})();
