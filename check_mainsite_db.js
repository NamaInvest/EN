const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Main-site .env DATABASE_URL ==="
grep DATABASE_URL /www/wwwroot/namainvist.com/.env 2>/dev/null | head -3

echo ""
echo "=== Saas-app .env DATABASE_URL ==="
grep DATABASE_URL /www/wwwroot/n11.namainvist.com/.env 2>/dev/null | head -3

echo ""
echo "=== Check tenant_accounts in main-site DB ==="
MAIN_DB=$(grep DATABASE_URL /www/wwwroot/namainvist.com/.env 2>/dev/null | head -1 | sed 's/.*\\/\\([^?]*\\).*/\\1/')
echo "Main DB: $MAIN_DB"
psql -U n11_db -h localhost -d "$MAIN_DB" -c "SELECT * FROM tenant_accounts;" 2>/dev/null || echo "Cannot query $MAIN_DB"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
