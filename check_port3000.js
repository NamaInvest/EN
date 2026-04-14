const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = `
echo "=== PM2 LIST ==="
pm2 list --no-color

echo ""
echo "=== PORTS IN USE (3000-3020) ==="
ss -tlnp | grep -E ':30(0[0-9]|1[0-9]|20)'

echo ""
echo "=== NGINX CONFIGS WITH PORT 3000 ==="
grep -r "localhost:3000" /etc/nginx/ 2>/dev/null

echo ""
echo "=== ALL .ENV PORT VALUES ==="
find /www/wwwroot -name ".env" -exec sh -c 'echo "--- {} ---"; grep "^PORT=" "{}"' \\;
`;
    conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
