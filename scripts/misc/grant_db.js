const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec("sudo -u postgres psql -d namainvest_db -c 'GRANT ALL PRIVILEGES ON DATABASE namainvest_db TO n11_db; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n11_db;'", (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
