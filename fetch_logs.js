const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('tail -n 100 /root/.pm2/logs/n10-error.log', (err, stream) => {
        let full = '';
        stream.on('data', d => full += d).on('close', () => {
            console.log(full);
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
