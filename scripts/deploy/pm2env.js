const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 env 29', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('close', (code, signal) => {
            console.log(out);
            conn.end();
        }).on('data', (data) => {
            out += data;
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
});
