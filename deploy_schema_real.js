const { Client } = require('ssh2');

const hostIp = '46.4.188.170';

async function deploySchema(serverIndex) {
    return new Promise((resolve) => {
        const conn = new Client();
        const serverName = `n${serverIndex}`;
        const basePath = `/www/wwwroot/${serverName}.namainvist.com`;

        console.log(`[${serverName}] Connecting to push Master Schema...`);

        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) return resolve(false);

                // Upload the master schema
                sftp.fastPut('d:/namasoft9-3-main/prisma/schema.prisma', `${basePath}/prisma/schema.prisma`, (err) => {
                    if (err) {
                        console.error(`[${serverName}] Upload Error`, err);
                        return resolve(false);
                    }
                    console.log(`[${serverName}] Schema uploaded. Generating Client & Pushing DB...`);
                    
                    const cmd = `cd ${basePath} && npx prisma generate && npx prisma db push --accept-data-loss && pm2 reload all`;
                    conn.exec(cmd, (err, stream) => {
                        if (err) return resolve(false);
                        stream.on('data', () => {});
                        stream.stderr.on('data', () => {});
                        stream.on('close', code => {
                            console.log(`[${serverName}] ✅ Database sync complete. Code: ${code}`);
                            conn.end();
                            resolve(true);
                        });
                    });
                });
            });
        }).on('error', () => resolve(false)).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function run() {
    console.log('--- GLOBAL MASTER SCHEMA SYNC ---');
    for (let i = 1; i <= 10; i += 5) {
        const batch = [];
        for (let j = 0; j < 5 && (i + j) <= 10; j++) {
            batch.push(deploySchema(i + j));
        }
        await Promise.all(batch);
    }
    console.log('\\n🚀🚀🚀 MASTER SCHEMA PUSHED AND DATABASES REBUILT ON ALL SERVERS! 🚀🚀🚀');
}

run();
