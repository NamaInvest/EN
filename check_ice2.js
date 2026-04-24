const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const commands = [
    // Check the deployed layout
    'cat /www/wwwroot/namainvist.com/src/app/ice/layout.tsx',
    // Check first 15 lines of deployed page
    'head -15 /www/wwwroot/namainvist.com/src/app/ice/page.tsx',
    // Check if the build output has any errors in the ICE chunk
    'ls -la /www/wwwroot/namainvist.com/.next/server/app/ice/',
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
