const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('tail -n 30 /www/wwwroot/fix_deps_log.txt', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', data => console.log(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
