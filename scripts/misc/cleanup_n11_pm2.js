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
  console.log('=== Cleaning up duplicate PM2 processes ===');
  // احذف الPROCESS الجديد المكرر (ID=16)
  console.log(await ssh(`pm2 delete 16 2>&1`));
  
  // تأكد من أن ID=3 موجود ومضبوط
  console.log('\n=== Current PM2 list ===');
  console.log(await ssh(`pm2 list 2>&1 | grep n11`));

  // تحقق من حجم .next/server  
  console.log('\n=== Check .next/server contents ===');
  console.log(await ssh(`ls ${N11}/.next/server/ 2>&1 | head -10`));

  // الخطأ الحقيقي: process 3 يشغل مسار قديم بدون .next
  // نحتاج نشغله من النقطة الصحيحة
  console.log('\n=== Get exact process 3 details ===');
  const desc = await ssh(`pm2 describe 3 2>&1`);
  console.log(desc);

  // استخرج مسار CWD الفعلي
  const cwdMatch = desc.match(/exec cwd\s*│\s*([^\s│]+)/);
  const cwd = cwdMatch ? cwdMatch[1].trim() : N11;
  console.log('\n[Detected CWD]:', cwd);

  // أوقف process 3 وأعد تشغيله مع تحديث البيئة
  console.log('\n=== Force restart process 3 with correct path ===');
  await ssh(`pm2 stop 3 2>&1`);
  await new Promise(r => setTimeout(r, 2000));
  
  // أعد تشغيله مع --update-env
  console.log(await ssh(`cd ${N11} && pm2 start 3 --update-env 2>&1`));
  
  await new Promise(r => setTimeout(r, 8000));

  console.log('\n=== Final PM2 list ===');
  console.log(await ssh(`pm2 list 2>&1 | grep n11`));

  console.log('\n=== HTTP Test port 3011 ===');
  console.log(await ssh(`curl -s -o /dev/null -w "HTTP: %{http_code}" http://localhost:3011/ 2>&1`));

  console.log('\n=== Logs (last 5) ===');
  console.log(await ssh(`tail -5 /root/.pm2/logs/n11-error.log 2>&1`));
})();
