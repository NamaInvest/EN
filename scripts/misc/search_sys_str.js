const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // We will run find to list all files, then grep through them. 
    // Just a clean command:
    const cmd = "find /www/wwwroot/namainvist.com/src -type f | xargs grep sys.str";
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out+=d.toString());
        stream.on('close', () => {
            console.log('RESULTS:');
            console.log(out.trim());
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
