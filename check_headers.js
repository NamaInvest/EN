const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Check headers of n2.namainvist.com from outside
    conn.exec(`
        curl -sI -H "Cookie: token=fake" https://n2.namainvist.com/dashboard
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
