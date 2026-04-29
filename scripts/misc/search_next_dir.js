const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Search in the SERVER-SIDE chunks (not static)
    conn.exec("grep -r '\"sys.str_9\"' /www/wwwroot/namainvist.com/.next/ 2>/dev/null | head -5", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('sys.str_9 in .next dir:');
            console.log(out.substring(0, 3000) || '(NONE)');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
