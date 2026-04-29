const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' };

const fileContent = 'google-site-verification: googlebe8c17f02d7742b4.html';

async function forceGoogle() {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected, injecting verified footprint directly into disk...`);
            
            // Recreate the file in all vital production paths
            const cmds = [
                `echo "${fileContent}" > /www/wwwroot/n1.namainvist.com/googlebe8c17f02d7742b4.html`,
                `echo "${fileContent}" > /www/wwwroot/n1.namainvist.com/public/googlebe8c17f02d7742b4.html`,
                `mkdir -p /www/wwwroot/n1.namainvist.com/.next/standalone/public`,
                `echo "${fileContent}" > /www/wwwroot/n1.namainvist.com/.next/standalone/public/googlebe8c17f02d7742b4.html`
            ];
            
            conn.exec(cmds.join(' && '), (err, stream) => {
                stream.on('close', () => {
                    console.log(`[${server.name}] Files injected.`);
                    // Let's also do a gentle PM2 reload just in case
                    conn.exec('pm2 reload all', (err, stream2) => {
                        stream2.on('close', () => {
                            console.log(`[${server.name}] PM2 reloaded.`);
                            conn.end();
                            resolve();
                        });
                    });
                });
            });
        }).on('error', () => resolve()).connect(server);
    });
}

forceGoogle();
