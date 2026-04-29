const { Client } = require('ssh2');

const bashCommand = `
echo "=== tenant-n11 error logs ==="
pm2 logs tenant-n11 --lines 30 --nostream 2>&1 | tail -35

echo ""
echo "=== n11 .env ==="
cat /www/wwwroot/n11.namainvist.com/.env
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
