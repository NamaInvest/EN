const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', () => {
    // List TS files in the root folder of the server
    conn.exec('find /www/wwwroot/namainvist.com -maxdepth 1 -name "*.ts"', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.on('close', () => {
            console.log('Root TS Files on Server:');
            console.log(out);
            conn.end();
        });
    });
}).connect(SERVER);
