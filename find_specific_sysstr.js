const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Check ALL components on namainvist.com for sys.str
    conn.exec("grep -rn 'sys.str_9\\b\\|sys.str_10\\b\\|sys.str_11\\b\\|sys.str_12\\b\\|sys.str_13\\b\\|sys.str_14\\b\\|sys.str_32\\b\\|sys.str_33\\b\\|sys.str_34\\b' /www/wwwroot/namainvist.com/src/ 2>&1", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('Files containing specific sys.str (9-14, 32-34):');
            console.log(out || '(NONE FOUND)');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
