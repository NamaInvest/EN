const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', () => {
    // List databases on PostgreSQL port 5432
    const cmd = `psql -h localhost -p 5432 -U postgres -l`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.on('close', () => {
            console.log('PostgreSQL Databases:');
            console.log(out);
            conn.end();
        });
    });
}).connect(SERVER);
