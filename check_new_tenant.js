const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(
        'psql -U n11_db -h localhost -d n11_db -c "SELECT id, subdomain, user_email, clerk_user_id, status, created_at FROM tenant_accounts ORDER BY id;" 2>/dev/null',
        (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => conn.end());
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
