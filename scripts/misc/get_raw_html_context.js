const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Get the ACTUAL raw HTML from the server
    conn.exec("curl -s http://127.0.0.1:2999/ | grep -o '.\\{60\\}sys\\.str_[0-9]\\{1,3\\}.\\{60\\}'", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('sys.str CONTEXT in raw HTML from server:');
            console.log(out || '(NONE FOUND)');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
