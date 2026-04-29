const { Client } = require('ssh2');

const hostIp = '46.4.188.170';

function pushDb() {
    return new Promise((resolve) => {
        const conn = new Client();
        const basePath = `/www/wwwroot/n1.namainvist.com`;
        
        console.log(`[n1] Connecting...`);
        conn.on('ready', () => {
            console.log(`[n1] Pushing Prisma Schema to DB...`);
            const cmd = `cd ${basePath} && npx prisma db push --accept-data-loss`;
            conn.exec(cmd, (err, stream) => {
                if (err) {
                    console.error(`[n1] Exec Error:`, err);
                    conn.end();
                    return resolve(false);
                }
                stream.on('data', d => console.log('STDOUT:', d.toString()));
                stream.stderr.on('data', d => console.error('STDERR:', d.toString()));
                stream.on('close', code => {
                    console.log(`[n1] PM2 Reloaded. Code: ${code}`);
                    conn.end();
                    resolve(true);
                });
            });
        }).on('error', (err) => {
            console.error(`[n1] Connection Error:`, err.message);
            resolve(false);
        }).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

pushDb();
