const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const commands = [
    // Get the actual HTML from /ice to see if there's a JS error embedded
    'curl -s http://localhost:3000/ice 2>&1 | head -50',
    // Check latest errors
    'pm2 logs main-site --err --lines 5 --nostream 2>&1',
    // Check if the build was clean
    'pm2 logs main-site --lines 10 --nostream 2>&1',
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
