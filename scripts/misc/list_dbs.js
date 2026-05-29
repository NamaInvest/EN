const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Get all _db databases
    conn.exec(
        "psql -U postgres -t -c \"SELECT datname FROM pg_database WHERE datname LIKE '%_db' AND datname != 'postgres';\" 2>/dev/null",
        (err, stream) => {
            let output = '';
            stream.on('data', d => output += d.toString());
            stream.stderr.on('data', () => {});
            stream.on('close', () => {
                const dbs = output.split('\n').map(s => s.trim()).filter(s => s && s.endsWith('_db'));
                console.log('Databases found:', dbs);
                conn.end();
            });
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
