const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== 1. DB Migration: إضافة أعمدة الاشتراك لـ tenant_accounts ==="
psql -U n11_db -h localhost -d n11_db << 'SQL'
ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial';
ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';
ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS invoice_quota INTEGER DEFAULT 30;
ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS product_quota INTEGER DEFAULT 1000;

-- حدّث السجلات الموجودة لضبط trial_ends_at = created_at + 7 days
UPDATE tenant_accounts SET trial_ends_at = created_at + INTERVAL '7 days' WHERE trial_ends_at IS NULL;

SELECT subdomain, subscription_status, plan, trial_ends_at, invoice_quota, product_quota FROM tenant_accounts;
SQL

echo ""
echo "=== 2. فحص بنية Sales API ==="
head -30 /www/wwwroot/n11.namainvist.com/src/app/api/sales/route.ts 2>/dev/null

echo ""
echo "=== 3. فحص بنية Products API ==="
head -30 /www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts 2>/dev/null

echo ""
echo "=== 4. فحص Dashboard Layout ==="
find /www/wwwroot/n11.namainvist.com/src/app -name "layout.tsx" | head -5
cat /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/layout.tsx 2>/dev/null | head -30
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
