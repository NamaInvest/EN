const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = 'export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin && cd /www/wwwroot/n1.namainvist.com && pm2 start npm --name "n1" -- run start -- -p 3001 && pm2 save';
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end()).resume();
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
