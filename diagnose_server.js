const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to fleet server');
  
  const commands = [
    // Check PM2 status for main-site
    'pm2 list | head -20',
    // Check Clerk env vars
    'cd /www/wwwroot/namainvist.com && grep -E "CLERK|NEXT_PUBLIC_CLERK" .env 2>/dev/null || echo "No .env found"',
    // Check PM2 logs for errors
    'pm2 logs main-site --lines 50 --nostream 2>&1 | tail -60',
    // Check if the build exists
    'ls -la /www/wwwroot/namainvist.com/.next/server/app/sign-in/ 2>/dev/null || echo "sign-in route not built"',
    'ls -la /www/wwwroot/namainvist.com/.next/server/app/sign-up/ 2>/dev/null || echo "sign-up route not built"',
    // Check node version
    'node -v',
  ];
  
  let idx = 0;
  function runNext() {
    if (idx >= commands.length) {
      conn.end();
      return;
    }
    const cmd = commands[idx++];
    console.log(`\n${'='.repeat(60)}\n>>> ${cmd}\n${'='.repeat(60)}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Exec error:', err); runNext(); return; }
      let output = '';
      stream.on('data', (d) => { output += d.toString(); process.stdout.write(d); });
      stream.stderr.on('data', (d) => { output += d.toString(); process.stderr.write(d); });
      stream.on('close', () => { runNext(); });
    });
  }
  runNext();
});

conn.on('error', (err) => { console.error('SSH Error:', err.message); });

conn.connect({
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: '_ee4SWbxLVfH9b',
});
