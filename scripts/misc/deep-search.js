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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  // Search entire filesystem for the file with "73 قسم برمجي"  
  console.log('=== Search for "73 قسم برمجي في بيئة موحدة" ===');
  const r1 = await ssh('grep -r "73 قسم برمجي في بيئة موحدة" /www/wwwroot/namainvist.com/src/ 2>/dev/null');
  console.log('In src/:', r1 || 'NOT FOUND ✅');
  
  // Check the compiled JS chunk directly for the old content
  console.log('\n=== Search "73 قسم" in compiled js ===');
  const r2 = await ssh('grep -rl "73 قسم" /www/wwwroot/namainvist.com/.next/ 2>/dev/null | head -5');
  console.log(r2 || 'NOT FOUND ✅');
  
  // Show the actual content of the compiled page chunk
  console.log('\n=== Show relevant part of compiled page chunk ===');
  const r3 = await ssh('ls /www/wwwroot/namainvist.com/.next/server/chunks/ssr/ | grep page');
  console.log('Page chunks:', r3);
  
  // Show first 200 chars of the page chunk
  const r4 = await ssh('head -c 500 /www/wwwroot/namainvist.com/.next/server/chunks/ssr/src_app_page_tsx_*.js 2>/dev/null | strings | head -20');
  console.log('Page chunk content sample:', r4);
  
  // Check current page.tsx on server - show line count and key content
  console.log('\n=== Server page.tsx stats ===');
  const r5 = await ssh('wc -l /www/wwwroot/namainvist.com/src/app/page.tsx && grep -c "cat:" /www/wwwroot/namainvist.com/src/app/page.tsx && grep "modulesList.length\\|104 وحدة" /www/wwwroot/namainvist.com/src/app/page.tsx | head -3');
  console.log(r5);
})();
