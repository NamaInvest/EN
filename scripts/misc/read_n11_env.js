const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/n11.namainvist.com/.env', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', d => console.log(d.toString()));
    });
}).connect(config);
