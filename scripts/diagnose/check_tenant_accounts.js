const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(
        'psql -U n11_db -h localhost -d nama_main_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name=\'tenant_accounts\' ORDER BY ordinal_position;" 2>/dev/null && psql -U n11_db -h localhost -d nama_main_db -c "SELECT * FROM tenant_accounts LIMIT 10;" 2>/dev/null',
        (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => conn.end());
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
