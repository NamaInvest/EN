const { Client } = require('ssh2');

// Read the actual provision log for the latest tenant
const bashCommand = `
echo "=== Provision log for 23 ==="
cat /tmp/provision_23.log 2>/dev/null || echo "No log for 23"
echo ""
echo "=== Is 23.namainvist.com running? ==="
pm2 show 23 2>/dev/null || echo "Process 23 not found in pm2"
echo ""
echo "=== NGINX config for 23? ==="
cat /etc/nginx/sites-available/23.namainvist.com 2>/dev/null || echo "No nginx config"
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
