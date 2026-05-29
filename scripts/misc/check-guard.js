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
  console.log('=== GlobalAuthGuard ===');
  const guard = await ssh('cat /www/wwwroot/namainvist.com/src/components/GlobalAuthGuard.tsx 2>/dev/null || cat /www/wwwroot/namainvist.com/src/components/GlobalAuthGuard.ts 2>/dev/null || echo "NOT FOUND"');
  console.log(guard);

  console.log('\n=== Providers.tsx ===');
  const providers = await ssh('cat /www/wwwroot/namainvist.com/src/components/Providers.tsx 2>/dev/null || echo "NOT FOUND"');
  console.log(providers);

  console.log('\n=== layout.tsx (full body/return) ===');
  const layout = await ssh('grep -A 40 "export default function RootLayout" /www/wwwroot/namainvist.com/src/app/layout.tsx 2>/dev/null | head -50');
  console.log(layout);
})();
