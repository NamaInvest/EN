const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
sleep 3
echo "=== Test port 3000 (main-site) after fix ==="
curl -s "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" 2>/dev/null

echo ""
echo "=== Test with email fallback ==="
curl -s "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs&email=ialqrashi62@gmail.com" 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
