const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('source ~/.bashrc && pm2 logs n2 --lines 50 --nostream', (err, stream) => {
        stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())).stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000 });
