const { Client } = require('ssh2');

const servers = [
    { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', name: 'N1' }
];

async function restartServer(server) {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected, restarting PM2...`);
            conn.exec('pm2 restart all', (err, stream) => {
                if (err) return resolve();
                stream.on('close', () => {
                    console.log(`[${server.name}] PM2 Restarted Successfully! Next.js will now serve the public file.`);
                    conn.end();
                    resolve();
                }).on('data', (data) => {
                    // console.log(data.toString());
                });
            });
        }).on('error', () => resolve()).connect(server);
    });
}

(async () => {
    console.log("Forcing PM2 Cache Reload...");
    await Promise.allSettled(servers.map(restartServer));
    console.log("Done.");
})();
