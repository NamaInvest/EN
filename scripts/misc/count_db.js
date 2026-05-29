const { Client } = require('ssh2');

function checkCount() {
    const conn = new Client();
    conn.on('ready', () => {
        conn.exec('sudo -u postgres psql -d n1_db -c "SELECT COUNT(*) FROM categories;" && sudo -u postgres psql -d n1_db -c "SELECT COUNT(*) FROM products;"', (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => conn.end());
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
}

checkCount();
