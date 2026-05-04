const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

const LOCAL_BASE = 'd:\\namasoft9-3-main';
const FILES = [
    "src/proxy.ts",
    "src/app/(dashboard)/accounting/multi-book/page.tsx",
    "src/app/(dashboard)/accounting/year-end-close/page.tsx",
    "src/app/(dashboard)/accounting/dunning/page.tsx",
    "src/app/(dashboard)/accounting/fixed-assets/page.tsx",
    "src/app/(dashboard)/accounting/leases/page.tsx",
    "src/app/(dashboard)/accounting/revenue-recognition/page.tsx",
    "src/app/(dashboard)/accounting/open-items/page.tsx",
    "src/app/(dashboard)/accounting/customer-statements/page.tsx"
];

function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(localPath);
        sftp.writeFile(remotePath, data, (err) => {
            if (err) reject(err); else resolve();
        });
    });
}

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; process.stdout.write(d.toString()); });
            stream.stderr.on('data', d => { stderr += d; process.stderr.write(d.toString()); });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

function mkdirRecursive(sftp, dirPath) {
    return new Promise((resolve) => {
        sftp.mkdir(dirPath, (err) => resolve());
    });
}

async function deploy() {
    const conn = new Client();
    console.log('🔌 Connecting...');
    
    conn.on('ready', async () => {
        console.log('✅ Connected!');
        try {
            const sftp = await new Promise((res, rej) => conn.sftp((err, s) => err ? rej(err) : res(s)));

            for (const target of TARGETS) {
                console.log(`\n🚀 DEPLOYING TO ${target.base}`);

                const dirs = new Set();
                for (const file of FILES) {
                    const parts = file.split('/');
                    let current = target.base;
                    for (let i = 0; i < parts.length - 1; i++) {
                        current += '/' + parts[i];
                        dirs.add(current);
                    }
                }

                for (const dir of [...dirs].sort()) {
                    await mkdirRecursive(sftp, dir);
                }

                for (const file of FILES) {
                    const localPath = path.join(LOCAL_BASE, file.replace(/\//g, '\\'));
                    const remotePath = `${target.base}/${file}`;
                    try {
                        if (fs.existsSync(localPath)) {
                            await uploadFile(sftp, localPath, remotePath);
                            console.log(`  ✅ Uploaded: ${file}`);
                        } else {
                            console.log(`  ⚠️ Skipped: ${file} (Local file not found)`);
                        }
                    } catch (e) {
                        console.log(`  ❌ Failed: ${file} — ${e.message}`);
                    }
                }

                console.log(`🗑️ Deleting old middleware.ts...`);
                await execCommand(conn, `rm -f ${target.base}/src/middleware.ts`);

                console.log(`🧹 Clearing .next cache...`);
                await execCommand(conn, `cd ${target.base} && rm -rf .next`);

                console.log(`🏗️ Building Next.js...`);
                await execCommand(conn, `cd ${target.base} && npm run build`);

                console.log(`🔄 Restarting PM2 (${target.pm2})...`);
                await execCommand(conn, `pm2 restart ${target.pm2}`);

                console.log(`🎉 Done for ${target.base}`);
            }
        } catch (err) { console.error('❌ Deploy error:', err.message); }
        conn.end();
    });
    conn.on('error', err => console.error('❌ Connection error:', err.message));
    conn.connect(SERVER);
}
deploy();
