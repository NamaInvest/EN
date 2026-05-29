const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('sudo -u postgres psql -t -c "SELECT datname FROM pg_database WHERE datname LIKE \'%_db\';"', (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; });
        stream.on('close', () => {
            console.log(out.trim());
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
