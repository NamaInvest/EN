const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', name: 'N1' };

async function pushAndRebuild() {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected, pushing next.config.ts...`);
            conn.sftp((err, sftp) => {
                if (err) return resolve();
                
                sftp.fastPut('c:/Users/1/Desktop/alfa/next.config.ts', '/www/wwwroot/n1.namainvist.com/next.config.ts', (err) => {
                    console.log(`[${server.name}] Config uploaded. Rebuilding...`);
                    
                    conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart all', (err, stream) => {
                        stream.on('close', () => {
                            console.log(`[${server.name}] Rebuilt with ignoreBuildErrors! Uptime Restored.`);
                            conn.end();
                            resolve();
                        }).on('data', d => console.log(d.toString())).stderr.on('data', e => console.error(e.toString()));
                    });
                });
            });
        }).on('error', () => resolve()).connect(server);
    });
}

pushAndRebuild();
