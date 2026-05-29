const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(
        'psql -U n11_db -h localhost -d n11_db -t -c "SELECT datname FROM pg_database;" 2>/dev/null | head -20',
        (err, stream) => {
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                console.log('DBs:', out);
                
                // Try with psql directly
                conn.exec("su postgres -c \"psql -t -c 'SELECT datname FROM pg_database;'\" 2>/dev/null | grep '_db'", (e, s) => {
                    let o2 = '';
                    s.on('data', d => o2 += d.toString());
                    s.stderr.on('data', () => {});
                    s.on('close', () => {
                        console.log('Direct DBs:', o2);
                        conn.end();
                    });
                });
            });
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
