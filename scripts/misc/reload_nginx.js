const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    conn.exec('nginx -s reload', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('NGINX reloaded');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
