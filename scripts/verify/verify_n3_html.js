const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
HTML=$(curl -s http://localhost:3003/login)
echo "=== Start HTML ==="
echo "$HTML" | head -c 2000
echo "=== ... ==="
echo "$HTML" | tail -c 2000
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
