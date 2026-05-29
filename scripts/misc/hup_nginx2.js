const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    conn.exec("ps aux | grep nginx | grep master | head -3", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('NGINX processes:', out);
            const match = out.match(/root\s+(\d+)/);
            if (match) {
                const pid = match[1];
                console.log('Found nginx master PID:', pid);
                conn.exec(`kill -HUP ${pid} && echo "HUP sent!"`, (err2, stream2) => {
                    if (err2) throw err2;
                    let out2 = '';
                    stream2.on('data', d => out2 += d.toString());
                    stream2.on('close', () => {
                        console.log('Result:', out2);
                        conn.end();
                    });
                });
            } else {
                console.log('Could not find nginx pid');
                conn.end();
            }
        });
    });
}).on('error', console.error).connect(config);
