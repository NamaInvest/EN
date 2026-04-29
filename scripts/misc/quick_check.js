const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const commands = [
    'pm2 logs main-site --err --lines 20 --nostream 2>&1',
    'curl -s -o /dev/null -w "Homepage: %{http_code}\n" http://localhost:3000/',
    'curl -s -o /dev/null -w "Sign-in: %{http_code}\n" http://localhost:3000/sign-in',
    'curl -s -o /dev/null -w "Sign-up: %{http_code}\n" http://localhost:3000/sign-up',
    'curl -s -o /dev/null -w "ICE: %{http_code}\n" http://localhost:3000/ice',
    'curl -s -o /dev/null -w "DL: %{http_code}\n" http://localhost:3000/ice/desktop-licenses',
    'pm2 show main-site 2>&1 | grep -E "restarts|uptime|status"',
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
