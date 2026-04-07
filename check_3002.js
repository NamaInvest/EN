const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    conn.exec(`
        echo "=== WHAT IS ON 3002 ==="
        ss -tlnp 2>/dev/null | grep 3002
        echo "=== ALL NODE PROCESSES ==="
        ps aux | grep node
        echo "=== PM2 STATUS ==="
        pm2 list
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
