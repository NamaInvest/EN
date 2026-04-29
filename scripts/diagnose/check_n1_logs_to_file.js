const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 logs nama-main --lines 200 --nostream', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('close', () => {
            fs.writeFileSync('n1_pm2.log', out);
            conn.end();
            console.log('Done');
        }).on('data', data => {
            out += data.toString();
        }).stderr.on('data', data => {
            out += data.toString();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
