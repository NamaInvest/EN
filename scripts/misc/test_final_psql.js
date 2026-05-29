const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('sudo -n -u postgres psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE test_db_final;"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
