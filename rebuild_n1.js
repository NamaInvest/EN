const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' };

async function rebuild() {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected, rebuilding Next.js to restore 502...`);
            // Run build and restart PM2
            conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart all', (err, stream) => {
                stream.on('close', () => {
                    console.log(`[${server.name}] Rebuild and Restart Complete! Uptime Restored.`);
                    conn.end();
                    resolve();
                }).on('data', d => console.log(d.toString()));
            });
        }).on('error', () => resolve()).connect(server);
    });
}

rebuild();
