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
  // Find ALL files containing "73 قسم" on the whole server
  console.log('=== Files with "73" content ===');
  const files73 = await ssh('grep -rl "73" /www/wwwroot/namainvist.com/src/ 2>/dev/null | head -20');
  console.log(files73);
  
  console.log('\n=== Current HEAD of page.tsx ===');
  const head = await ssh('head -5 /www/wwwroot/namainvist.com/src/app/page.tsx');
  console.log(head);
  
  console.log('\n=== Check if Turbopack is caching source maps ===');
  const turbo = await ssh('ls /www/wwwroot/namainvist.com/.next/server/chunks/ssr/ 2>/dev/null | head -10');
  console.log(turbo);
  
  // Check the RSC (React Server Components) output
  console.log('\n=== Check built RSC for 73 ===');
  const rsc73 = await ssh('grep -l "73" /www/wwwroot/namainvist.com/.next/server/chunks/ssr/*.js 2>/dev/null | head -5');
  console.log(rsc73 || 'none');
})();
