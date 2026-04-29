const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /root/.pm2/logs/n2-error.log | tail -n 200', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', d => { data += d.toString(); });
        stream.on('close', () => {
            const lines = data.split('\n');
            lines.forEach((l, i) => {
                if (l.includes('File upload error') || l.includes('PrismaClientKnownRequestError')) {
                    console.log('--- FOUND AT LINE ' + i);
                    console.log(lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 8)).join('\n'));
                }
            });
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
