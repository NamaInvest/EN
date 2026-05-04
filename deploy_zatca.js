const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

const LOCAL_BASE = 'd:\\namasoft9-3-main';

const FILES = [
    "src/app/(dashboard)/sales/history/page.tsx",
    "src/app/(dashboard)/sales/orders/page.tsx",
    "src/app/(dashboard)/sales/page.tsx",
    "src/app/(dashboard)/treasury/bank-reconciliation/page.tsx",
    "src/app/api/ai-auditor/route.ts",
    "src/app/layout.tsx",
    "src/app/master-panel/layout.tsx",
    "src/components/InvoiceReceipt.tsx",
    "src/lib/mfa-engine.ts",
    "src/lib/telegram-bot.ts",
    "src/lib/zatca-java.ts",
    "src/locales/ar.json",
    "src/locales/en.json",
    "src/scripts/telegram-poll.js",
    "src/scripts/telegram-poll.ts",
    "deploy_zatca.js"
];

function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(localPath);
        sftp.writeFile(remotePath, data, (err) => {
            if (err) reject(err);
            else resolve();
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
    console.log('🔌 Connecting to Fleet Server (46.4.188.170)...');
    
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        try {
            const sftp = await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
            });

            for (const target of TARGETS) {
                console.log(`\n==================================================`);
                console.log(`🚀 DEPLOYING TO ${target.base}`);
                console.log(`==================================================\n`);

                let uploaded = 0;
                for (const file of FILES) {
                    const localPath = path.join(LOCAL_BASE, file.replace(/\//g, '\\'));
                    const remotePath = `${target.base}/${file}`;
                    
                    if (!fs.existsSync(localPath)) {
                        console.log(`  ⚠️  SKIP (not found): ${file}`);
                        continue;
                    }
                    try {
                        await uploadFile(sftp, localPath, remotePath);
                        uploaded++;
                        console.log(`  ✅ ${file}`);
                    } catch (e) {
                        console.log(`  ❌ FAIL: ${file} — ${e.message}`);
                    }
                }

                console.log(`\n📊 Uploaded ${uploaded}/${FILES.length} files to ${target.base}\n`);
                console.log('🏗️  Building Next.js...');
                await execCommand(conn, `cd ${target.base} && rm -rf .next && npm run build`);

                console.log(`\n🔄 Restarting PM2 (${target.pm2})...`);
                await execCommand(conn, `pm2 restart ${target.pm2}`);

                console.log(`\n🎉 Deploy to ${target.base} COMPLETE!`);
            }
        } catch (err) {
            console.error('❌ Deploy error:', err.message);
        }
        conn.end();
    });

    conn.on('error', (err) => console.error('❌ Connection error:', err.message));
    conn.connect(SERVER);
}

deploy();
