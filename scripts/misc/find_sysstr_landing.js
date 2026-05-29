const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    conn.exec("grep -rn 'sys.str_9' /www/wwwroot/namainvist.com/src/ --include='*.tsx' 2>&1", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('GREP RESULTS:');
            console.log(out);
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
