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
    // Flush PM2 logs, then test
    await exec(c, 'pm2 flush saas-app 2>&1');
    
    const HOST = 'brightstartradingco.namainvist.com';
    let r = await exec(c, `curl -s -m 5 -X POST http://localhost:3500/api/auth/login -H 'Host: ${HOST}' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}' 2>&1`);
    const token = JSON.parse(r).token;
    
    // Try product with a category-less approach
    r = await exec(c, `curl -s -m 10 -X POST http://localhost:3500/api/products -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"name":"Test123","buyPrice":"100","sellPrice":"200","unitId":"1","taxRate":"15"}' 2>&1`);
    console.log('Product response:', r);
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Get FULL error
    r = await exec(c, 'pm2 logs saas-app --lines 30 --nostream 2>&1');
    console.log('\nFull logs:\n', r);
    
    // Seed accounts with parent_id = 0 instead of NULL
    console.log('\n--- Seeding accounts ---');
    const sql = `
INSERT INTO accounts (code, name, type, parent_id, level) VALUES
('1000', 'الأصول', 'asset', 0, 1),
('1001', 'الصندوق', 'asset', 0, 2),
('1002', 'البنك', 'asset', 0, 2),
('1003', 'العملاء', 'asset', 0, 2),
('1004', 'المخزون', 'asset', 0, 2),
('2000', 'الخصوم', 'liability', 0, 1),
('2001', 'الموردون', 'liability', 0, 2),
('2002', 'ضريبة القيمة المضافة', 'liability', 0, 2),
('3000', 'حقوق الملكية', 'equity', 0, 1),
('3001', 'رأس المال', 'equity', 0, 2),
('4000', 'الإيرادات', 'revenue', 0, 1),
('4001', 'المبيعات', 'revenue', 0, 2),
('5000', 'المصروفات', 'expense', 0, 1),
('5001', 'تكلفة البضاعة المباعة', 'expense', 0, 2),
('5002', 'الرواتب والأجور', 'expense', 0, 2),
('5003', 'هالك المخزون', 'expense', 0, 2)
ON CONFLICT (code) DO NOTHING;`;
    r = await exec(c, `PGPASSWORD=n11_pass123 psql -h localhost -U n11_db -d brightstartradingco_db -c "${sql.replace(/\n/g, ' ')}" 2>&1`);
    console.log('Accounts:', r);

    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
