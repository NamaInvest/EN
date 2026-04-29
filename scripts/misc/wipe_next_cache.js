const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' };

async function clearCache() {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected, purging cache...`);
            conn.exec('rm -rf /www/wwwroot/n1.namainvist.com/.next/cache && pm2 restart all', (err, stream) => {
                stream.on('close', () => {
                    console.log(`[${server.name}] Cache nuked and PM2 restarted!`);
                    conn.end();
                    resolve();
                });
            });
        }).on('error', () => resolve()).connect(server);
    });
}

clearCache();
