const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== PM2 ports ==="
pm2 list
echo ""
echo "=== Listening ports ==="
ss -tlnp | grep node | head -10

echo ""
echo "=== Test login on correct port ==="
PORT=$(ss -tlnp | grep -oP ':\K[0-9]+' | head -5)
echo "Ports: $PORT"

# Try common ports
for PORT in 3000 3500 3001 8080; do
    RESULT=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:$PORT/api/health -H "Host: namainvest.namainvist.com" 2>/dev/null)
    echo "Port $PORT: HTTP $RESULT"
done
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
