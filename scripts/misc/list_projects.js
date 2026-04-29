const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== PM2 Apps ==="
pm2 list

echo ""
echo "=== Websites in /www/wwwroot ==="
ls -la /www/wwwroot/ | grep "^d" | awk '{print $9}' | grep -v "^\.$\|^\.\.$"

echo ""
echo "=== Nginx vhosts (domains) ==="
ls /www/server/panel/vhost/nginx/*.conf 2>/dev/null | xargs -I{} basename {} .conf | sort

echo ""
echo "=== PostgreSQL Databases ==="
sudo -u postgres psql -h localhost -p 5432 -t -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1') ORDER BY datname;"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
