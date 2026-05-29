const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Find the CWD of PID 1751536 (the process on port 2999)
    conn.exec("ls -la /proc/1751536/cwd 2>/dev/null && ls -la /proc/1751525/cwd 2>/dev/null", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('CWD of processes on port 2999:');
            console.log(out);
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
