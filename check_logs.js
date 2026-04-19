const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec([
        // Delete test user
        'PGPASSWORD=n11_pass123 psql -U n11_db -h localhost -d mgmg_db -c "DELETE FROM user_permissions WHERE user_id = 3; DELETE FROM users WHERE username = \'cashier01\';" 2>&1',
        'echo "Test user cleaned"',
    ].join(' && '), (e, s) => {
        let out = '';
        s.on('data', d => out += d.toString());
        s.on('close', () => { console.log(out); c.end(); });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
