const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
echo "=== pm2 n3 status ==="
pm2 show n3 --no-color 2>/dev/null | grep -iE 'port|script|args|args'

echo "=== processes listening on 3003 ==="
netstat -tulpn | grep 3003

echo "=== processes listening on other 300* ports ==="
netstat -tulpn | grep -E '300[0-9]'
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
