const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected...');

    const cmd = `
echo "=== PM2 STATUS ==="
pm2 list --no-color

echo ""
echo "=== PORTS ACTIVE ==="
ss -tlnp | grep -E ':30[0-9]{2}'

echo ""
echo "=== N11 STATUS ==="
ls /www/wwwroot/n11.namainvist.com/.next 2>/dev/null && echo ".next EXISTS" || echo ".next MISSING"
cat /www/wwwroot/n11.namainvist.com/.env 2>/dev/null | grep PORT
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
