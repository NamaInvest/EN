const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    # Clear old logs first
    > /root/.pm2/logs/main-site-error.log;
    sleep 1;
    # Trigger sign-in
    curl -s http://localhost:3000/sign-in > /dev/null 2>&1;
    sleep 3;
    # Show new errors only
    echo "=== NEW ERRORS ===";
    cat /root/.pm2/logs/main-site-error.log;
    echo "=== HTTP STATUS ===";
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sign-in;
    echo "";
    # Also check the response headers
    echo "=== RESPONSE HEADERS ===";
    curl -s -I http://localhost:3000/sign-in 2>/dev/null | head -10;
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
