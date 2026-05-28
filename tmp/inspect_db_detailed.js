const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', () => {
    // List databases directly using SQL query
    const sql = "SELECT datname FROM pg_database WHERE datname NOT LIKE 'template%' ORDER BY datname;";
    const cmd = `psql -h localhost -p 5432 -U postgres -t -c "${sql}"`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.on('close', () => {
            console.log('PostgreSQL Databases:');
            console.log(out.trim().split('\n').map(x => x.trim()).filter(Boolean).join(', '));
            conn.end();
        });
    });
}).connect(SERVER);
