const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    conn.exec(`
pm2 list --no-color | grep -v "^$"
echo "=== cwds ==="
pm2 show ice 2>/dev/null | grep "exec cwd"
pm2 show main-site 2>/dev/null | grep "exec cwd"
pm2 show saas-app 2>/dev/null | grep "exec cwd"
pm2 show saas-dev 2>/dev/null | grep "exec cwd"
`, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
