const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Check main-site ecosystem ==="
cat /www/wwwroot/namainvist.com/ecosystem.config.js 2>/dev/null | head -20

echo ""
echo "=== Check .next exists ==="
ls /www/wwwroot/namainvist.com/.next/ 2>/dev/null | head -5 || echo "NO .next"

echo ""
echo "=== Check check-status content on server ==="
head -15 /www/wwwroot/namainvist.com/src/app/api/tenant/check-status/route.ts 2>/dev/null

echo ""
echo "=== Force build main-site again ==="
cd /www/wwwroot/namainvist.com && npm run build 2>&1 | grep -E "(error|Error|Done|Built|Failed|compiled)" | head -10
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
