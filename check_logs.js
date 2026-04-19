const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec([
        // Check what user exists
        'echo "=== USERS ===" && PGPASSWORD=n11_pass123 psql -U n11_db -h localhost -d mgmg_db -c "SELECT id, username, role, default_page FROM users ORDER BY id" 2>&1',
        // Check permissions
        'echo "=== PERMISSIONS ===" && PGPASSWORD=n11_pass123 psql -U n11_db -h localhost -d mgmg_db -c "SELECT up.user_id, u.username, up.module FROM user_permissions up JOIN users u ON u.id = up.user_id ORDER BY up.user_id" 2>&1',
    ].join(' && '), (e, s) => {
        let out = '';
        s.on('data', d => out += d.toString());
        s.on('close', () => { console.log(out); c.end(); });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
