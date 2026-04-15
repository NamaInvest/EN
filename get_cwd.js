const {Client} = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 status n11 && curl -s -I http://localhost:3011', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
