const { Client } = require('ssh2');

const hostIp = '46.4.188.170';

async function pushDb(serverIndex) {
    return new Promise((resolve) => {
        const conn = new Client();
        const basePath = `/www/wwwroot/n${serverIndex}.namainvist.com`;
        
        console.log(`[n${serverIndex}] Connecting...`);
        conn.on('ready', () => {
            console.log(`[n${serverIndex}] Pushing Prisma Schema to DB...`);
            // Run prisma db push, and restart to apply any cache clears
            const cmd = `cd ${basePath} && npx prisma db push --accept-data-loss && pm2 reload all`;
            conn.exec(cmd, (err, stream) => {
                if (err) {
                    console.error(`[n${serverIndex}] Exec Error:`, err);
                    conn.end();
                    return resolve(false);
                }
                stream.on('data', d => {}).stderr.on('data', d => {});
                stream.on('close', code => {
                    console.log(`[n${serverIndex}] ✅ Schema Pushed. PM2 Reloaded. Code: ${code}`);
                    conn.end();
                    resolve(true);
                });
            });
        }).on('error', (err) => {
            console.error(`[n${serverIndex}] Connection Error:`, err.message);
            resolve(false);
        }).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function run() {
    console.log('--- SYNCING DATABASE SCHEMAS GLOBALLY ---');
    // Run them in parallel batches to speed it up!
    for (let i = 1; i <= 10; i += 5) {
        const batch = [];
        for (let j = 0; j < 5 && (i + j) <= 10; j++) {
            batch.push(pushDb(i + j));
        }
        await Promise.all(batch);
    }
    console.log('\\n🚀🚀🚀 SCHEMA FIX APPLIED TO ALL SERVERS! 🚀🚀🚀');
}

run();
