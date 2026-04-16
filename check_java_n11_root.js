const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const conn = new Client();
conn.on('ready', () => {
    conn.exec('ls -la /opt/zatca-einvoicing-sdk-238-R3.4.8/', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', data => process.stdout.write(data.toString()));
    });
}).connect(config);
