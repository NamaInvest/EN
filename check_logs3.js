const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /root/.pm2/logs/n2-error.log /root/.pm2/logs/n2-out.log | tail -n 5000', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', d => { data += d.toString(); });
        stream.on('close', () => {
            const lines = data.split('\n');
            lines.forEach((l, i) => {
                if (l.includes('OCR Error')) {
                    console.log('--- FOUND OCR ERROR AT LINE ' + i);
                    console.log(lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 10)).join('\n'));
                }
            });
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
