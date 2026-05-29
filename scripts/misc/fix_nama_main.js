const { Client } = require('ssh2');

const bashCommand = `
echo "=== nama-main error ==="
pm2 logs nama-main --lines 15 --nostream 2>&1 | tail -20

echo ""
echo "=== Does /www/wwwroot/namainvist.com work? ==="
ls /www/wwwroot/namainvist.com/.next 2>/dev/null && echo "Build exists" || echo "No build!"
cat /www/wwwroot/namainvist.com/.env | head -3

echo ""
echo "=== also n7 - is it truly n7? ==="
pm2 show tenant-n7 2>&1 | grep -E "script path|port|status"
cat /www/wwwroot/n7.namainvist.com/.env | grep PORT
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
});
