const { Client } = require('ssh2');

const bashCommand = `
sudo -u postgres psql -c "\\du testdb99"
sudo -u postgres psql -c "\\du n1_db"
sudo -u postgres psql -d testdb99 -c "\\dn+ public"
sudo -u postgres psql -d n1_db -c "\\dn+ public"
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
