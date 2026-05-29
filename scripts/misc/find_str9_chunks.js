const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Search in the JS CHUNKS for "sys.str_9" and nearby context
    conn.exec("grep -r 'str_9' /www/wwwroot/namainvist.com/.next/static/chunks/ 2>/dev/null | grep -v 'str_9[0-9]' | head -5", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('str_9 in chunks:');
            console.log(out.substring(0, 2000) || '(NONE)');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
