const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  // Run all commands with proper separator
  conn.exec(`
    curl -s http://localhost:3000/sign-in > /dev/null 2>&1;
    sleep 2;
    echo "===ERROR LOG===";
    tail -50 /root/.pm2/logs/main-site-error.log 2>/dev/null;
    echo "===SIGN-IN HTML===";
    curl -s http://localhost:3000/sign-in 2>/dev/null | head -50;
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.stderr.on('data', d => out += d.toString());
    stream.on('close', () => { console.log(out); conn.end(); });
  });
});
conn.on('error', (err) => console.error('SSH err:', err.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
