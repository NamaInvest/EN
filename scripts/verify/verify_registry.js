const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(
        'psql -U n11_db -h localhost -d n11_db -c "SELECT id, clerk_user_id, user_email, subdomain, status FROM tenant_accounts;" 2>/dev/null',
        (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => conn.end());
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
