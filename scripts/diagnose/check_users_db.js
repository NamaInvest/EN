const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
echo "=== مستخدمو n7_db ==="
sudo -u postgres psql -d n7_db -c "SELECT id, username, \\"fullName\\", role, active FROM \\"User\\" ORDER BY id;" 2>/dev/null

echo "=== مستخدمو n11_db ==="
sudo -u postgres psql -d n11_db -c "SELECT id, username, \\"fullName\\", role, active FROM \\"User\\" ORDER BY id;" 2>/dev/null
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
