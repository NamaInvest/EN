const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('tail -n 200 /root/.pm2/logs/n1-error.log', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', chunk => { data += chunk; });
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
