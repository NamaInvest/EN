const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin && fuser -k 3001/tcp || true && sleep 2 && pm2 restart n1 && pm2 logs n1 --lines 10 --nostream', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end()).resume();
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
