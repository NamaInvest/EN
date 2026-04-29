const { Client } = require('ssh2');

const bashCommand = `
echo "Dropping exist databases..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS icei_db;"
sudo -u postgres psql -c "DROP ROLE IF EXISTS icei_db;"
echo "Done!"
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
