const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('source /root/.nvm/nvm.sh && export PATH=/www/server/nodejs/v22.11.0/bin:$PATH && cd /www/wwwroot/n2.namainvist.com && npm run build', (err, stream) => {
        stream.on('close', (code) => {
            console.log("Exit code:", code);
            conn.end();
        }).on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000 });
