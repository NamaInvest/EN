const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) { resolve('ERROR: ' + err.message); return; }
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.stderr.on('data', d => out += d.toString());
            stream.on('close', () => resolve(out.trim()));
        });
    });
}
c.on('ready', async () => {
    console.log('Connected — Schema sync with superuser\n');

    // Grant superuser privs to n11_db temporarily
    await exec(c, `PGPASSWORD=RootPassNama123 psql -h localhost -U postgres -c "ALTER ROLE n11_db SUPERUSER;" 2>&1`);
    console.log('✅ n11_db granted SUPERUSER');

    const dbs = ['brightstartradingco_db', 'ahmedalyamicompany_db', 'leave_db', 'mgmg_db', 'shippy_db', 'whatname_db'];

    for (const db of dbs) {
        console.log(`\n🔄 ${db}...`);
        const dbUrl = `postgresql://n11_db:n11_pass123@localhost:5432/${db}`;
        const r = await exec(c, `cd /www/wwwroot/n11.namainvist.com && DATABASE_URL="${dbUrl}" npx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -3`);
        console.log(`  ${r.replace(/\n/g, ' | ')}`);
    }

    // Seed accounts - first add unique constraint on code
    console.log('\n\n🌱 Seeding accounts...');
    await exec(c, `PGPASSWORD=n11_pass123 psql -h localhost -U n11_db -d brightstartradingco_db -c "CREATE UNIQUE INDEX IF NOT EXISTS accounts_code_key ON accounts(code);" 2>&1`);
    
    const accountsSQL = `
INSERT INTO accounts (code, name, type, parent_id, level) VALUES
('1000', 'الأصول', 'asset', NULL, 1),
('1001', 'الصندوق', 'asset', NULL, 2),
('1002', 'البنك', 'asset', NULL, 2),
('1003', 'العملاء - ذمم مدينة', 'asset', NULL, 2),
('1004', 'المخزون', 'asset', NULL, 2),
('2000', 'الخصوم', 'liability', NULL, 1),
('2001', 'الموردون - ذمم دائنة', 'liability', NULL, 2),
('2002', 'ضريبة القيمة المضافة', 'liability', NULL, 2),
('3000', 'حقوق الملكية', 'equity', NULL, 1),
('3001', 'رأس المال', 'equity', NULL, 2),
('4000', 'الإيرادات', 'revenue', NULL, 1),
('4001', 'المبيعات', 'revenue', NULL, 2),
('5000', 'المصروفات', 'expense', NULL, 1),
('5001', 'تكلفة البضاعة المباعة', 'expense', NULL, 2),
('5002', 'الرواتب والأجور', 'expense', NULL, 2),
('5003', 'هالك المخزون', 'expense', NULL, 2)
ON CONFLICT (code) DO NOTHING;`;
    let r = await exec(c, `PGPASSWORD=n11_pass123 psql -h localhost -U n11_db -d brightstartradingco_db -c "${accountsSQL.replace(/\n/g, ' ')}" 2>&1`);
    console.log('  Accounts:', r);

    // Revoke superuser
    await exec(c, `PGPASSWORD=RootPassNama123 psql -h localhost -U postgres -c "ALTER ROLE n11_db NOSUPERUSER;" 2>&1`);
    console.log('\n✅ Revoked SUPERUSER from n11_db');

    // Restart PM2
    await exec(c, 'pm2 restart saas-app');
    console.log('✅ PM2 restarted');
    await new Promise(r => setTimeout(r, 5000));

    // Quick test
    const HOST = 'brightstartradingco.namainvist.com';
    r = await exec(c, `curl -s -m 5 -X POST http://localhost:3500/api/auth/login -H 'Host: ${HOST}' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}' 2>&1`);
    const token = JSON.parse(r).token;
    
    r = await exec(c, `curl -s -m 5 -X POST http://localhost:3500/api/products -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"name":"Final Test","buyPrice":100,"sellPrice":200}' 2>&1`);
    console.log(`\n🧪 Product: ${r.substring(0, 120)}`);

    // Check accounts
    r = await exec(c, `curl -s -m 5 http://localhost:3500/api/accounting/trial-balance -H 'Host: ${HOST}' -H 'Authorization: Bearer ${token}' -b 'token=${token}' 2>&1 | head -c 200`);
    console.log(`🧪 Accounts: ${r.substring(0, 120)}`);

    console.log('\n=== DONE ===');
    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
