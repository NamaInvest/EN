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
    }).connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  console.log('=== middleware.ts ===');
  const mw = await ssh('head -60 /www/wwwroot/namainvist.com/src/middleware.ts');
  console.log(mw);

  console.log('\n=== page.tsx ===');
  const page = await ssh('cat /www/wwwroot/namainvist.com/src/app/page.tsx');
  console.log(page);

  console.log('\n=== _landing.tsx hero ===');
  const landing = await ssh('grep -n "h1\\|104\\|97\\|73 قسم\\|LandingPage\\|redirect\\|sign-in" /www/wwwroot/namainvist.com/src/app/_landing.tsx | head -10');
  console.log(landing);

  console.log('\n=== Live response at port 2999 ===');
  const curl = await ssh('curl -sv http://localhost:2999/ 2>&1 | grep -E "< HTTP|< location|< cache|redirecting|sign-in" | head -10');
  console.log(curl);

  console.log('\n=== Cloudflare bypass test ===');
  const cf = await ssh('curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}" http://localhost:2999/ 2>/dev/null');
  console.log('Status:', cf);

  console.log('\n=== Check if body has redirect to sign-in ===');
  const body = await ssh('curl -s http://localhost:2999/ 2>/dev/null | head -5');
  console.log(body);
})();
