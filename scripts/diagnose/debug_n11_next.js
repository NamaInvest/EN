const { Client } = require('ssh2');

function ssh(cmd, timeout = 60000) {
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
  // العثور على كل .next folders على السيرفر
  console.log('=== All .next folders on server ===');
  console.log(await ssh(`find /www/wwwroot -maxdepth 3 -name ".next" -type d 2>&1`));

  // البحث عن .next للـ n11 تحديداً
  console.log('\n=== N11 main dir .next check ===');
  console.log(await ssh(`ls -la ${N11}/.next/BUILD_ID 2>&1`));

  // اختبار مباشر: هل next يستطيع قراءة .next؟
  console.log('\n=== Test if next can read the build ===');
  console.log(await ssh(`ls ${N11}/.next/server/app 2>&1 | head -5`));
  
  // Important: ربما الـ .next ملكيته ليست root
  console.log('\n=== .next ownership ===');
  console.log(await ssh(`ls -la ${N11}/ | grep .next 2>&1`));

  // تجربة: تشغيل next start يدوياً لمعرفة الخطأ الحقيقي
  console.log('\n=== Manually test next start for 3 seconds ===');
  console.log(await ssh(`cd ${N11} && timeout 5 node node_modules/next/dist/bin/next start -p 3011 2>&1 | head -20`, 15000));
})();
