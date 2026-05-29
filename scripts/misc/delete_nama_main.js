const { Client } = require('ssh2');

const bashCommand = `
echo "=== Removing obsolete nama-main process (duplicate of tenant-n1) ==="
pm2 delete nama-main || true

echo ""
echo "=== Final clean PM2 list ==="
pm2 ls

pm2 save
echo "All clean!"
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
    password: 'process.env.SSH_PASSWORD'
});
