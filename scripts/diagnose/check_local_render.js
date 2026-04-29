const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Get the actual HTML served to check for sys.str in the rendered output
    conn.exec("curl -s http://127.0.0.1:2999/ | grep -o 'sys.str_[0-9]*' | sort -u | head -30", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('SYS.STR in RENDERED HTML from port 2999:');
            console.log(out || '(NONE FOUND - CLEAN!)');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
