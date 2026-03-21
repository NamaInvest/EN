const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const fileTasks = [
    { local: 'd:/namasoft9-3-main/src/app/api/settings/generate-keys/route.ts', remote: '/src/app/api/settings/generate-keys/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/zatca/route.ts', remote: '/src/app/api/zatca/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/(dashboard)/settings/page.tsx', remote: '/src/app/(dashboard)/settings/page.tsx' }
];

function execute(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => { resolve(); });
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

const run = async () => {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', async () => {
            const basePath = `/www/wwwroot/n1.namainvist.com`;
            conn.sftp(async (err, sftp) => {
                if (err) { conn.end(); return resolve(); }
                try {
                    console.log(`[N1] Uploading ZATCA UI patch...`);
                    for (const f of fileTasks) { await fastPut(sftp, f.local, basePath + f.remote); }
                    console.log(`[N1] Files Synced. Generating React bundle...`);
                    await execute(conn, `cd ${basePath} && npm run build && pm2 restart n1 || true`);
                    console.log(`[N1] DONE!`);
                } catch (e) { console.error(e); } finally { conn.end(); resolve(); }
            });
        }).connect(SSH_CONFIG);
    });
};
run();
