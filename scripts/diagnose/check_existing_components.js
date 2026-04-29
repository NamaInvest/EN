const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== TrialBanner component ==="
cat /www/wwwroot/n11.namainvist.com/src/components/TrialBanner.tsx 2>/dev/null

echo ""
echo "=== SubscriptionGuard component ==="
cat /www/wwwroot/n11.namainvist.com/src/components/SubscriptionGuard.tsx 2>/dev/null

echo ""
echo "=== Products POST handler (find where POST starts) ==="
grep -n "export async function POST" /www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts 2>/dev/null

echo ""
echo "=== Sales POST handler line ==="
grep -n "export async function POST" /www/wwwroot/n11.namainvist.com/src/app/api/sales/route.ts 2>/dev/null

echo ""
echo "=== Check if quotaGuard already exists ==="
cat /www/wwwroot/n11.namainvist.com/src/lib/quotaGuard.ts 2>/dev/null || echo "NOT EXISTS"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
