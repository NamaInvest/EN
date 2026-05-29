const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) { resolve('ERROR: ' + err.message); return; }
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.stderr.on('data', d => out += d.toString());
            stream.on('close', () => resolve(out));
        });
    });
}
c.on('ready', async () => {
    console.log('Connected\n');
    
    // All tenant databases that need the schema update
    const dbs = [
        'brightstartradingco_db',
        'ahmedalyamicompany_db', 
        'leave_db',
        'mgmg_db',
        'n11_db',
        'shippy_db',
        'whatname_db',
        'nama_main_db',
    ];
    
    const sql = "ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT; ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false; CREATE TABLE IF NOT EXISTS shipments (id SERIAL PRIMARY KEY, sales_invoice_id INT, purchase_order_id INT, carrier TEXT DEFAULT '', tracking_number TEXT DEFAULT '', status TEXT DEFAULT 'pending', estimated_delivery TIMESTAMP, actual_delivery TIMESTAMP, shipping_cost FLOAT DEFAULT 0, recipient_name TEXT DEFAULT '', recipient_phone TEXT DEFAULT '', recipient_address TEXT DEFAULT '', recipient_city TEXT DEFAULT '', notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());";
    
    for (const db of dbs) {
        // Try with n11_db user first (owner), then postgres
        let r = await exec(c, `PGPASSWORD=n11_pass123 psql -h localhost -U n11_db -d ${db} -c "${sql}" 2>&1`);
        if (r.includes('FATAL') || r.includes('error')) {
            // Try postgres superuser
            r = await exec(c, `PGPASSWORD=RootPassNama123 psql -h localhost -U postgres -d ${db} -c "${sql}" 2>&1`);
        }
        const ok = r.includes('ALTER TABLE') || r.includes('CREATE TABLE') || r.includes('already exists');
        console.log(`${ok ? '✅' : '❌'} ${db}: ${r.trim().replace(/\n/g, ' | ').substring(0, 100)}`);
    }
    
    // Restart PM2
    await exec(c, 'pm2 restart saas-app 2>&1');
    console.log('\n✅ PM2 restarted');
    
    // Wait and test login
    await new Promise(r => setTimeout(r, 4000));
    let r = await exec(c, `curl -s -m 5 -X POST http://localhost:3500/api/auth/login -H 'Host: brightstartradingco.namainvist.com' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}' 2>&1 | head -c 300`);
    const loginOk = r.includes('token');
    console.log(`\n${loginOk ? '✅' : '❌'} Login test: ${r.trim().substring(0, 150)}`);
    
    console.log('\n=== DONE ===');
    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:15000});
