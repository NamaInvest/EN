const { Client } = require('ssh2');

// Cleanup messy fake tenants and find correct next port
const bashCommand = `
echo "=== 1. Cleaning up messy fake tenants (11 and 23) ==="
pm2 delete 11 || true
pm2 delete 23 || true
rm -rf /www/wwwroot/11.namainvist.com
rm -rf /www/wwwroot/23.namainvist.com
rm -f /etc/nginx/sites-enabled/11.namainvist.com
rm -f /etc/nginx/sites-enabled/23.namainvist.com
rm -f /etc/nginx/sites-available/11.namainvist.com
rm -f /etc/nginx/sites-available/23.namainvist.com
sudo -u postgres psql -c "DROP DATABASE IF EXISTS 11_db;" || true
sudo -u postgres psql -c "DROP DATABASE IF EXISTS 23_db;" || true
systemctl reload nginx

echo "=== 2. Fixing namainvist.com port (landing MUST use unique port 3000) ==="
sed -i 's/^PORT=3001/PORT=3000/' /www/wwwroot/namainvist.com/.env

echo "=== 3. What is currently listening? Check carefully ==="
for d in /www/wwwroot/*/; do 
    if [ -f "$d/.env" ]; then
        PORT=$(grep "^PORT=" "$d/.env" | cut -d'=' -f2)
        echo "$d => PORT=$PORT"
    fi
done

echo ""
echo "=== 4. Restarting landing page with corrected port ==="
pm2 restart nama-landing

pm2 save
echo "Cleanup complete!"
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
    password: '_ee4SWbxLVfH9b'
});
