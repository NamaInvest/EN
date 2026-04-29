const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('ls -lh /www/wwwroot/*.tar.gz', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        if (err) throw err;
        stream.on('close', () => {
            console.log(output);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
