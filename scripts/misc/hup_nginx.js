const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Get the nginx master pid and send it HUP signal to reload gracefully
    conn.exec("cat /run/nginx.pid || cat /var/run/nginx.pid || pgrep -f 'nginx: master' | head -1", (err, stream) => {
        if (err) throw err;
        let pid = '';
        stream.on('data', d => pid += d.toString().trim());
        stream.on('close', () => {
            console.log('NGINX master PID:', pid);
            if (!pid) {
                console.log('Could not find nginx PID');
                conn.end();
                return;
            }
            // Use kill -HUP to reload gracefully
            conn.exec(`kill -HUP ${pid} && echo "Reloaded nginx PID ${pid}"`, (err2, stream2) => {
                if (err2) throw err2;
                let out = '';
                stream2.on('data', d => out += d.toString());
                stream2.stderr.on('data', d => out += 'ERR:' + d.toString());
                stream2.on('close', () => {
                    console.log('Kill HUP result:', out);
                    conn.end();
                });
            });
        });
    });
}).on('error', console.error).connect(config);
