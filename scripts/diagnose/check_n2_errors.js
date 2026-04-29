const { Client } = require('ssh2');

// Check error logs for the errored servers
const bashCommand = `
echo "=== Checking errored servers ==="

echo "--- tenant-n2 error log ---"
pm2 logs tenant-n2 --lines 10 --nostream 2>&1 | tail -15

echo "--- n2-main error log ---"
pm2 logs n2-main --lines 10 --nostream 2>&1 | tail -10

echo "--- tenant-n3 error log ---"
pm2 logs tenant-n3 --lines 10 --nostream 2>&1 | tail -10

echo "--- .env of n2 ---"
cat /www/wwwroot/n2.namainvist.com/.env 2>/dev/null | head -5
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
