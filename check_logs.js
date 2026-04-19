const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec([
        // Check hidden modules for mgmg
        'echo "=== MGMG HIDDEN MODULES ===" && PGPASSWORD=n11_pass123 psql -U n11_db -h localhost -d mgmg_db -c "SELECT key, value FROM settings WHERE key = \'hidden_modules\'" 2>&1',
        // Check hidden modules for shippy
        'echo "=== SHIPPY HIDDEN MODULES ===" && PGPASSWORD=n11_pass123 psql -U n11_db -h localhost -d shippy_db -c "SELECT key, value FROM settings WHERE key = \'hidden_modules\'" 2>&1',
        // Check trial_ends_at for mgmg
        'echo "=== MGMG TRIAL ===" && PGPASSWORD=n11_pass123 psql -U n11_db -h localhost -d n11_db -c "SELECT subdomain, plan, trial_ends_at, created_at FROM tenant_accounts WHERE subdomain = \'mgmg\'" 2>&1',
    ].join(' && '), (e, s) => {
        let out = '';
        s.on('data', d => out += d.toString());
        s.on('close', () => { console.log(out); c.end(); });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
