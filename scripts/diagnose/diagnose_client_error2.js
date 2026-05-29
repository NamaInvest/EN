const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmds = [
    'cd /www/wwwroot/namainvist.com && cat .env 2>/dev/null',
    'cd /www/wwwroot/namainvist.com && echo "---ENV.LOCAL---" && cat .env.local 2>/dev/null || echo "NO .env.local"',
    'cd /www/wwwroot/namainvist.com && echo "---ECOSYSTEM---" && cat ecosystem.config.js 2>/dev/null || echo "NO ecosystem"',
    'cd /www/wwwroot/namainvist.com && echo "---PM2 ENV---" && pm2 show main-site 2>/dev/null | grep -A 5 "node env"',
    // Check what port it's actually on
    'cd /www/wwwroot/namainvist.com && echo "---PORT CHECK---" && pm2 show main-site 2>/dev/null | grep -E "port|PORT|exec cwd|script path"',
    // Check for GlobalAuthGuard usage
    'cd /www/wwwroot/namainvist.com && echo "---LAYOUT HEAD---" && head -30 src/app/layout.tsx 2>/dev/null || echo "NOT FOUND"',
    // Check if there are any useSession calls in components
    'cd /www/wwwroot/namainvist.com && echo "---USESESSION---" && grep -rn "useSession" src/components/ 2>/dev/null | head -10',
    'cd /www/wwwroot/namainvist.com && echo "---GLOBALAUTH---" && cat src/components/GlobalAuthGuard.tsx 2>/dev/null | head -30',
    // npm ls clerk
    'cd /www/wwwroot/namainvist.com && echo "---CLERK VERSIONS---" && npm ls @clerk/shared 2>/dev/null | head -10',
  ];
  const all = cmds.join(' && echo "=======" && ');
  conn.exec(all, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.stderr.on('data', d => out += d.toString());
    stream.on('close', () => { console.log(out); conn.end(); });
  });
});
conn.on('error', (err) => console.error('SSH Error:', err.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
