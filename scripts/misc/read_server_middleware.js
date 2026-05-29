const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== محتوى middleware.ts على السيرفر ==="
cat /www/wwwroot/namainvist.com/src/middleware.ts

echo ""
echo "=== .env على main-site ==="
cat /www/wwwroot/namainvist.com/.env | grep -v "KEY\|SECRET\|PASSWORD\|PASS" | head -30
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
