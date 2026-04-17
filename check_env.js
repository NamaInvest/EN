const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    // Check .env file on server for ZEPTOMAIL vars
    const cmd = `grep -E "ZEPTO|EMAIL" /www/wwwroot/namainvist.com/.env | head -20`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.resume();
        let output = '';
        stream.on('data', d => { output += d; });
        stream.on('close', () => {
            console.log('=== ENV VARS ===\n', output);
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
