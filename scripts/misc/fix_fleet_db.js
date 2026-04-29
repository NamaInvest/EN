const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    console.log('Connected');
    
    const sql = "ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT; ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false; CREATE TABLE IF NOT EXISTS shipments (id SERIAL PRIMARY KEY, sales_invoice_id INT, purchase_order_id INT, carrier TEXT DEFAULT '', tracking_number TEXT DEFAULT '', status TEXT DEFAULT 'pending', estimated_delivery TIMESTAMP, actual_delivery TIMESTAMP, shipping_cost FLOAT DEFAULT 0, recipient_name TEXT DEFAULT '', recipient_phone TEXT DEFAULT '', recipient_address TEXT DEFAULT '', recipient_city TEXT DEFAULT '', notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());";
    
    // Use -h localhost to force TCP connection instead of socket
    const cmd = `PGPASSWORD=RootPassNama123 psql -h localhost -p 5432 -U postgres -d n11_db -c "${sql}" 2>&1 && echo SQL_OK`;
    
    c.exec(cmd, (err, stream) => {
        if (err) { console.error(err); c.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log(out);
            if (out.includes('SQL_OK')) {
                console.log('\n=== DB UPDATED ===');
                // Now restart main-site
                c.exec('pm2 restart main-site 2>&1', (e, s) => {
                    let o = '';
                    s.on('data', d => o += d.toString());
                    s.on('close', () => { console.log('PM2:', o.includes('✓') ? 'Restarted' : o); c.end(); });
                });
            } else {
                console.log('=== FAILED ===');
                c.end();
            }
        });
    });
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
