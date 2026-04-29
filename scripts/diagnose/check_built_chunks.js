const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // check what the built JS chunks contain
    conn.exec("grep -r 'sys.str' /www/wwwroot/namainvist.com/.next/server/ 2>&1 | head -50", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('BUILT CHUNKS RESULTS:');
            console.log(out.substring(0, 3000));
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
