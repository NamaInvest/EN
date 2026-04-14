const { Client } = require('ssh2');

const SERVER = '46.4.188.170';

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
    }).connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

(async () => {
  console.log('=== middleware.ts (full) ===');
  const mw = await ssh('cat /www/wwwroot/namainvist.com/src/middleware.ts');
  console.log(mw);
  
  console.log('\n=== layout.tsx (first 50 lines) ===');
  const layout = await ssh('head -60 /www/wwwroot/namainvist.com/src/app/layout.tsx');
  console.log(layout);
  
  console.log('\n=== page.tsx ===');
  const page = await ssh('cat /www/wwwroot/namainvist.com/src/app/page.tsx');
  console.log(page);
  
  console.log('\n=== Curl: HTTP response code + redirect ===');
  const resp = await ssh('curl -s -o /dev/null -w "HTTP: %{http_code}\\nRedirect: %{redirect_url}\\nSize: %{size_download}" http://localhost:2999/');
  console.log(resp);
  
  console.log('\n=== Body snippet (first 300 chars) ===');
  const body = await ssh('curl -s http://localhost:2999/ 2>/dev/null | head -c 300');
  console.log(body);
})();
