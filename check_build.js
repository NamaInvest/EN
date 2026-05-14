const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Connected');
    conn.exec('cd /www/wwwroot/namainvist.com && npm run build', (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => console.log(data.toString()));
        stream.stderr.on('data', (data) => console.error(data.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
