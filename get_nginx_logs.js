const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep -i "POST /api/settings" /www/wwwlogs/n1.log | tail -n 20', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', data => process.stdout.write(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
