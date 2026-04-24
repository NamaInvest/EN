const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmds = [
    // get the error log after restart
    'sleep 2 && curl -s http://localhost:3000/sign-in > /dev/null 2>&1',
    'sleep 2 && echo "---ERROR LOG---" && tail -30 /root/.pm2/logs/main-site-error.log 2>/dev/null',
    // Also check what sign-in page returns 
    'echo "---SIGN-IN RESPONSE---" && curl -s http://localhost:3000/sign-in 2>/dev/null | head -20',
    // Check environment for CLERK keys
    'echo "---CLERK KEYS CHECK---" && pm2 env 17 2>/dev/null | grep -i clerk',
    // Check .env file for missing CLERK vars
    'echo "---ENV CLERK---" && cd /www/wwwroot/namainvist.com && grep -i "CLERK\|DESKTOP" .env 2>/dev/null',
  ];
  conn.exec(cmds.join(' && echo "======" && '), (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.stderr.on('data', d => out += d.toString());
    stream.on('close', () => { console.log(out); conn.end(); });
  });
});
conn.on('error', (err) => console.error('SSH err:', err.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
