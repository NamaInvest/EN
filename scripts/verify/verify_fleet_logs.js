const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('tail -n 2 /root/hotfix_build_n*.log', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        if (err) throw err;
        stream.on('close', () => {
            console.log(output);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000 });
