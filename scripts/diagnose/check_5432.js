const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec("PGPASSWORD=\"n11_pass123\" psql -h 127.0.0.1 -p 5432 -U n11_db -d postgres -c 'SELECT rolname, rolcreatedb FROM pg_roles;'", (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
