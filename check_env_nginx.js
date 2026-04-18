const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== .env of saas-app ==="
cat /www/wwwroot/n11.namainvist.com/.env | grep -v "SECRET\|KEY\|PASS" | head -30
echo ""
echo "=== nginx config for yessip ==="
ls /www/server/panel/vhost/nginx/ | grep yessip
cat /www/server/panel/vhost/nginx/yessip.namainvist.com.conf 2>/dev/null | head -30
echo ""
echo "=== Testing with x-tenant header ==="
curl -s -H "x-tenant: yessip" http://127.0.0.1:3500/api/settings | head -50
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
