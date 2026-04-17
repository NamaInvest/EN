const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
pm2 logs saas-app --nostream --lines 15 2>/dev/null | grep -E "Error|error|TENANT|x-tenant|n11"
echo "---"
curl -sv http://127.0.0.1:3500/ 2>&1 | grep -E "< HTTP|Location|error" | head -5
`, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
