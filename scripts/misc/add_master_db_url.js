const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Add MASTER_DB_URL to main-site .env ==="
echo '' >> /www/wwwroot/namainvist.com/.env
echo 'MASTER_DB_URL="postgresql://n11_db:n11_pass123@localhost:5432/n11_db?schema=public"' >> /www/wwwroot/namainvist.com/.env
echo "✅ Added MASTER_DB_URL"
grep MASTER_DB_URL /www/wwwroot/namainvist.com/.env

echo ""
echo "=== Restart main-site to pick up new env ==="
pm2 restart main-site

sleep 5
echo "=== Final test ==="
curl -s "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
