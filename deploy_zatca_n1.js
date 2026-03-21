const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const fileTasks = [
    { local: 'd:/namasoft9-3-main/src/scripts/zatca-sign-invoice.js', remote: '/src/scripts/zatca-sign-invoice.js' },
    { local: 'd:/namasoft9-3-main/src/app/api/settings/generate-keys/route.ts', remote: '/src/app/api/settings/generate-keys/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/zatca/route.ts', remote: '/src/app/api/zatca/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/zatca/qr/route.ts', remote: '/src/app/api/zatca/qr/route.ts' }
];

function execute(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                resolve();
            });
        });
    });
}

function fastPut(sftp, local, remote) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(local, remote, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function rebuildServer(i) {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', async () => {
            console.log(`\n============================`);
            console.log(`[N${i}] Commencing ZATCA Phase 2 Infrastructure Deployment...`);
            
            const basePath = `/www/wwwroot/n${i}.namainvist.com`;
            
            try {
                console.log(`[N${i}] Creating remote directories if missing...`);
                await execute(conn, `mkdir -p "${basePath}/src/scripts" && mkdir -p "${basePath}/src/app/api/settings/generate-keys" && mkdir -p "${basePath}/src/app/api/zatca/qr"`);
            } catch (e) {
                console.warn('Mkdir warning:', e);
            }

            conn.sftp(async (err, sftp) => {
                if (err) {
                    console.error(`[N${i}] SFTP Error`, err);
                    conn.end();
                    return resolve();
                }
                
                try {
                    console.log(`[N${i}] Uploading ZATCA Crypto Handlers...`);
                    for (const f of fileTasks) {
                        try {
                            await fastPut(sftp, f.local, basePath + f.remote);
                        } catch (sftpErr) {
                            console.error(`Failed to upload ${f.local}`, sftpErr);
                        }
                    }
                    console.log(`[N${i}] Files Synced. Installing Cryptographic dependencies...`);
                    
                    // Force installing zatca components on the actual server before building
                    const cmd = `cd ${basePath} && npm install zatca-xml-js qrcode --legacy-peer-deps && npm run build && pm2 restart n${i} || true`;
                    await execute(conn, cmd);
                    
                    console.log(`[N${i}] Done! ZATCA Foundation enabled on N${i}.`);
                } catch (e) {
                    console.error(`[N${i}] Fatal Exception:`, e.message || e);
                } finally {
                    conn.end();
                    resolve();
                }
            });
        }).on('error', (e) => {
            console.error(`[N${i}] Connection Error:`, e);
            resolve();
        }).connect(SSH_CONFIG);
    });
}

async function run() {
    console.log('Starting Phase 9.4 ZATCA Cryptographic Upgrade on N1...');
    await rebuildServer(1);
    console.log('N1 sync complete.');
}

run();
