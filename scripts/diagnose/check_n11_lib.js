const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`ls /www/wwwroot/n11.namainvist.com/src/lib/ | grep -E "valid|api-hand|handler"`, (err, stream) => {
        stream.on('close', () => conn.end())
            .on('data', d => process.stdout.write('LIB: ' + d.toString()))
            .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect(config);
