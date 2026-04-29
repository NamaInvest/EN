const { Client } = require('ssh2');

const bashCommand = `
echo "Cleaning n1 users via SQL..."
sudo -u postgres psql -d n1_db -c "DELETE FROM \\"UserPermission\\" WHERE user_id IN (SELECT id FROM \\"User\\" WHERE role != 'admin');"
sudo -u postgres psql -d n1_db -c "DELETE FROM \\"User\\" WHERE role != 'admin';"
echo "Done cleaning!"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
