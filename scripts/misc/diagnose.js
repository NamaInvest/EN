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
  // Show the ACTUAL page.tsx content (first 10 lines + line count)  
  const info = await ssh('wc -l /www/wwwroot/namainvist.com/src/app/page.tsx && head -5 /www/wwwroot/namainvist.com/src/app/page.tsx && tail -5 /www/wwwroot/namainvist.com/src/app/page.tsx');
  console.log('=== page.tsx on server ===\n', info);
  
  // Show lines containing old hard-coded modules
  const old = await ssh('grep -n "فاتورة الزكاة\\|bots تليجرام\\|ModulesList\\|modulesList" /www/wwwroot/namainvist.com/src/app/page.tsx | head -10');
  console.log('\n=== Old module references ===\n', old);

  // Show the actual index.html first 100 chars  
  const html = await ssh('head -c 300 /www/wwwroot/namainvist.com/.next/server/app/index.html 2>/dev/null | strings | head -10');
  console.log('\n=== Built index.html sample ===\n', html);
})();
