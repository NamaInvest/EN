const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        'echo "=== PM2 Status ==="',
        'pm2 list',
        'echo "=== BUILD_IDs ==="',
        'echo -n "main: "; cat /www/wwwroot/namainvist.com/.next/BUILD_ID 2>/dev/null || echo MISSING',
        'echo -n "n1:   "; cat /www/wwwroot/n1.namainvist.com/.next/BUILD_ID 2>/dev/null || echo MISSING',
        'echo -n "n11:  "; cat /www/wwwroot/n11.namainvist.com/.next/BUILD_ID 2>/dev/null || echo MISSING',
        'echo "=== Health Checks ==="',
        'curl -s --max-time 8 -o /dev/null -w "3000: %{http_code}\\n" http://localhost:3000/',
        'curl -s --max-time 8 -o /dev/null -w "3001: %{http_code}\\n" http://localhost:3001/',
        'curl -s --max-time 8 -o /dev/null -w "3002: %{http_code}\\n" http://localhost:3002/',
        'echo "=== Logs (main-site) ==="',
        'pm2 logs main-site --lines 5 --nostream 2>&1 | tail -8',
    ].join(' && ');
    
    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err.message); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).on('error', e => console.error('SSH Error:', e.message))
  .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
