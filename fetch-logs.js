const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 logs main-site --lines 50 --nostream', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', (d) => { data += d.toString(); });
        stream.stderr.on('data', (d) => { data += d.toString(); });
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error(err);
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 10000
});
