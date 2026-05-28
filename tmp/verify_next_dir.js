const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/namainvist.com && ls -la .next/ && cat .next/BUILD_ID', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect(SERVER);
