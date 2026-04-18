const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(
        'ls -la /tmp/namainvist_provisioned.json 2>/dev/null || echo "FILE_MISSING" ; psql -U postgres -c "SELECT datname FROM pg_database WHERE datname LIKE \'%_db%\';" 2>/dev/null | head -20',
        (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => conn.end());
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
