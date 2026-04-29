const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

(async () => {
  // Search for the specific text we see on screen
  console.log('=== Search for "73 قسم برمجي في بيئة موحدة" in all source files ===');
  const r1 = await ssh('grep -r "73" /www/wwwroot/namainvist.com/src/ 2>/dev/null | grep -v ".next" | grep -v "node_modules"');
  console.log(r1);
  
  // Search for "إنشاء حساب جديد" - the button text visible in the screenshot
  console.log('\n=== Search for button text visible on page ===');
  const r2 = await ssh('grep -r "إنشاء حساب" /www/wwwroot/namainvist.com/src/ 2>/dev/null | head -10');
  console.log(r2);
  
  // Search for "نظام مؤسسي متكامل" - exact H1 text
  console.log('\n=== Search for H1 text ===');
  const r3 = await ssh('grep -r "نظام مؤسسي متكامل\\|بوت تليجرام\\|فاتورة الزكاة" /www/wwwroot/namainvist.com/src/ 2>/dev/null | head -10');
  console.log(r3);
  
  // Show ALL tsx source files
  console.log('\n=== ALL .tsx files in src/ ===');
  const r4 = await ssh('find /www/wwwroot/namainvist.com/src/ -name "*.tsx" 2>/dev/null | grep -v ".next" | grep -v node_modules');
  console.log(r4);
})();
