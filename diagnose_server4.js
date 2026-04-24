const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  
  const commands = [
    // Check HTTP status codes
    'curl -s -o /dev/null -w "Homepage: %{http_code}\n" http://localhost:3000/',
    'curl -s -o /dev/null -w "Sign-in: %{http_code}\n" http://localhost:3000/sign-in',
    'curl -s -o /dev/null -w "Sign-up: %{http_code}\n" http://localhost:3000/sign-up',
    // Check if there's something on port 2999
    'curl -s -o /dev/null -w "Port2999: %{http_code}\n" http://localhost:2999/ 2>&1 || echo "Port 2999 not responding"',
    // Check what nginx proxies to
    'grep -A20 "server_name.*namainvist" /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null | head -30',
    // Check the latest error more specifically
    'pm2 logs main-site --err --lines 10 --nostream 2>&1',
  ];
  
  let idx = 0;
  function runNext() {
    if (idx >= commands.length) { conn.end(); return; }
    const cmd = commands[idx++];
    console.log(`\n>>> ${cmd}`);
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
