const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Cleaning up PM2 ===" 
# Delete the old stuck process (id 25)
pm2 delete 25 2>/dev/null || true
pm2 save
pm2 list

echo ""
echo "=== Final API test ==="
TOKEN=$(curl -s -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: namainvest.namainvist.com" \
  -d '{"username":"admin","password":"admin"}' 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','NO_TOKEN')[:20])" 2>/dev/null)
echo "Login: \${TOKEN}..."

COUNT=$(curl -s http://127.0.0.1:3000/api/settings \
  -H "Host: namainvest.namainvist.com" \
  -H "Authorization: Bearer \$(curl -s -X POST http://127.0.0.1:3000/api/auth/login -H 'Content-Type: application/json' -H 'Host: namainvest.namainvist.com' -d '{"username":"admin","password":"admin"}' 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin).get("token",""))' 2>/dev/null)" \
  2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Settings count: {len(d) if isinstance(d,list) else \"ERROR\"}')" 2>/dev/null)
echo "\$COUNT"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
