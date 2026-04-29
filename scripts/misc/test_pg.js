const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`export PGPASSWORD="Nama2024secure" && pg_dumpall -U postgres -h localhost > /dev/null && echo "postgres user works" || echo "postgres failed"; export PGPASSWORD="Nama2024secure" && pg_dumpall -U namasoft -h localhost > /dev/null && echo "namasoft user works" || echo "namasoft failed"`, (err, stream) => {
        stream.on('data', d => console.log(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
