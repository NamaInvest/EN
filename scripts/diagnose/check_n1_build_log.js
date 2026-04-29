const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to 46.4.188.170');
    conn.exec('tail -n 100 /www/wwwroot/n1.namainvist.com/build.log || tail -n 100 /tmp/deploy_n1_full.log', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            console.log(data.toString());
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', keepaliveInterval: 10000 });
