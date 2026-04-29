const { Client } = require('ssh2');

const bashCommand = `
echo "=== PM2 Status ==="
pm2 status nama-landing

echo -e "\n=== Last 20 lines of PM2 Logs for nama-landing ==="
pm2 logs nama-landing --lines 20 --nostream

echo -e "\n=== Checking .env file ==="
cat /www/wwwroot/namainvist.com/.env | grep CLERK
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
