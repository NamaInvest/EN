const { Client } = require('ssh2');

const bashCommand = `
echo "=== Error log for PM2 process 23 ==="
pm2 logs 23 --lines 30 --nostream 2>&1

echo ""
echo "=== .env file for 23 ==="
cat /www/wwwroot/23.namainvist.com/.env 2>/dev/null
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
