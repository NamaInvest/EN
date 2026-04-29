const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  
  const commands = [
    // Check DESKTOP_MODE env var
    'cd /www/wwwroot/namainvist.com && grep DESKTOP_MODE .env 2>/dev/null || echo "DESKTOP_MODE NOT SET"',
    // Check the ecosystem config
    'cat /www/wwwroot/namainvist.com/ecosystem.config.js 2>/dev/null || echo "No ecosystem.config.js"',
    // Check package.json start script and PORT
    'cd /www/wwwroot/namainvist.com && grep -E "PORT|DESKTOP" .env 2>/dev/null',
    // Check if there are multiple @clerk/shared versions
    'cd /www/wwwroot/namainvist.com && npm ls @clerk/shared 2>&1 | head -20',
    // Also check the PM2 startup config
    'pm2 show main-site 2>&1 | head -30',
    // Check the layout.tsx on the server
    'head -30 /www/wwwroot/namainvist.com/src/app/layout.tsx 2>/dev/null',
  ];
  
  let idx = 0;
  function runNext() {
    if (idx >= commands.length) { conn.end(); return; }
    const cmd = commands[idx++];
    console.log(`\n${'='.repeat(60)}\n>>> ${cmd}\n${'='.repeat(60)}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Exec error:', err); runNext(); return; }
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', () => runNext());
    });
  }
  runNext();
});

conn.on('error', (err) => console.error('SSH Error:', err.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
