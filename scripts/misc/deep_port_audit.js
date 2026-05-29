const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = `
echo "=== PROCESS ON PORT 3001 ==="
ls -la /proc/1504/exe 2>/dev/null
cat /proc/1504/cmdline 2>/dev/null | tr '\\0' ' '
echo ""

echo ""
echo "=== namainvist.com FOLDER ==="
ls /www/wwwroot/namainvist.com/ 2>/dev/null | head -10
cat /www/wwwroot/namainvist.com/.env 2>/dev/null

echo ""
echo "=== NGINX CONFIG FOR MAIN SITE ==="
cat /etc/nginx/sites-available/namainvist.com

echo ""
echo "=== ALL NGINX CONFIGS WITH 3001 ==="
grep -r "localhost:3001" /etc/nginx/ 2>/dev/null

echo ""
echo "=== ALL NGINX CONFIGS WITH 2999 ==="
grep -r "localhost:2999" /etc/nginx/ 2>/dev/null
`;
    conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: 'process.env.SSH_PASSWORD'
});
