const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 reload n1 --update-env', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
