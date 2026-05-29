const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', name: 'N1' };

async function fetchLogs() {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected, fetching PM2 error logs...`);
            conn.exec('pm2 logs --lines 30 --err --nostream', (err, stream) => {
                stream.on('close', () => {
                    conn.end();
                    resolve();
                }).on('data', d => console.log(d.toString()));
            });
        }).on('error', () => resolve()).connect(server);
    });
}

fetchLogs();
