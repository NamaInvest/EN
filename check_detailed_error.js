const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmds = [
    // Trigger the error
    'curl -s http://localhost:3000/sign-in > /dev/null 2>&1',
    'sleep 1',
    // Get latest error
    'echo "===ERROR LOG===" && tail -40 /root/.pm2/logs/main-site-error.log 2>/dev/null',
    // Get sign-in HTML response
    'echo "===SIGN-IN HTML===" && curl -s http://localhost:3000/sign-in 2>/dev/null | head -30',
    // Check CLERK from pm2 env
    'echo "===PM2 ENV===" && pm2 env 17 2>/dev/null | grep -iE "CLERK|DESKTOP|PORT|DATABASE" | head -15',
    // Check if .env has the right clerk keys
    'echo "===DOT ENV CLERK===" && cd /www/wwwroot/namainvist.com && grep -E "CLERK|DESKTOP_MODE" .env',
  ];
  conn.exec(cmds.join('\n'), (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.stderr.on('data', d => out += d.toString());
    stream.on('close', () => { console.log(out); conn.end(); });
  });
});
conn.on('error', (err) => console.error('SSH err:', err.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
