const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = `
        echo "=== CPU & RAM STATS ==="
        free -m
        echo "\n=== TOP PROCESSES ==="
        top -b -n 1 | head -n 15
        echo "\n=== PM2 STATUS ==="
        pm2 list
        echo "\n=== PM2 LOGS FOR NAMAINVIST_ROOT (Last 10 lines) ==="
        pm2 logs namainvist_root --lines 10 --nostream
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
