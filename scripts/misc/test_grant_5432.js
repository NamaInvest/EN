const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec("sudo -u postgres psql -h localhost -p 5432 -U postgres -c 'ALTER USER n11_db CREATEDB;'", (err, stream) => {
        let out = '';
        stream.on('data', d => { out+=d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
