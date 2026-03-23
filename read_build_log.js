const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/n1.namainvist.com/build.log', (err, stream) => {
        if (err) throw err;
        let dataStr = '';
        stream.on('data', (data) => {
            dataStr += data.toString();
        });
        stream.on('close', (code) => {
            conn.end();
            if (dataStr.length > 2000) {
                console.log(dataStr.substring(dataStr.length - 2000));
            } else {
                console.log(dataStr);
            }
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
