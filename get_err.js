const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Run a quick build and capture full error
    conn.exec(`cd /www/wwwroot/n2.namainvist.com && NODE_ENV=production npx next build 2>&1 | tail -40`, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
