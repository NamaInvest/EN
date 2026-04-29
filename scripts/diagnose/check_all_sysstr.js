const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Check ALL tsx files under namainvist.com/src for sys.str
    conn.exec("grep -rn 'sys.str' /www/wwwroot/namainvist.com/src/ 2>&1 | head -30", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('ALL sys.str in namainvist.com/src:');
            console.log(out || '(NONE - CLEAN!)');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
