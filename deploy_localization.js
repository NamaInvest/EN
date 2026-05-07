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
    "src/locales/ar.json",
    "src/locales/en.json",
    "src/components/Sidebar.tsx",
    "src/app/(dashboard)/admin/knowledge/page.tsx",
    "src/app/(dashboard)/admin/llm-costs/page.tsx",
    "src/app/(dashboard)/admin/prompts/page.tsx",
    "src/app/(dashboard)/ap/capture/page.tsx",
    "src/app/(dashboard)/finance/budget-planning/page.tsx",
    "src/app/(dashboard)/sales/atp-simulator/page.tsx",
    "src/app/(dashboard)/shopfloor/page.tsx",
    "src/app/(dashboard)/treasury/cash-position/page.tsx",
    "src/app/(dashboard)/treasury/liquidity/page.tsx"
];

async function deploy() {
    console.log(`\n🚀 Starting Localization Sync (Phase 4)`);
    console.log(`📦 Files to sync: ${FILES.length}\n`);

    const conn = new Client();
    
    conn.on('ready', () => {
        conn.sftp(async (err, sftp) => {
            if (err) throw err;

            for (const target of TARGETS) {
                console.log(`\n===========================================`);
                console.log(`🌐 Syncing to: ${target.base}`);
                console.log(`===========================================`);

                for (const file of FILES) {
                    const localPath = path.join(LOCAL_BASE, file);
                    const remotePath = `${target.base}/${file.replace(/\\/g, '/')}`;

                    if (!fs.existsSync(localPath)) {
                        console.log(`⚠️ Missing local: ${file}`);
                        continue;
                    }

                    await new Promise((resolve) => {
                        const remoteDir = path.dirname(remotePath);
                        conn.exec(`mkdir -p "${remoteDir}"`, () => {
                            sftp.fastPut(localPath, remotePath, (err) => {
                                if (err) {
                                    console.log(`❌ Failed: ${file}`);
                                } else {
                                    console.log(`✅ Uploaded: ${file}`);
                                }
                                resolve();
                            });
                        });
                    });
                }

                // Run build and restart pm2
                console.log(`\n⚙️ Building & Restarting ${target.pm2}...`);
                await new Promise((resolve) => {
                    const cmd = `cd ${target.base} && npm run build && pm2 restart ${target.pm2}`;
                    conn.exec(cmd, (err, stream) => {
                        if (err) throw err;
                        stream.on('close', (code, signal) => {
                            console.log(`🟢 ${target.pm2} Restarted (Exit code: ${code})`);
                            resolve();
                        }).on('data', (data) => {
                            // Suppress build logs to keep output clean, unless it's an error
                            if(data.toString().includes('error')) {
                                console.log(`[Build Msg]: ${data.toString().trim()}`);
                            }
                        }).stderr.on('data', (data) => {
                            console.log(`[Build Error]: ${data.toString().trim()}`);
                        });
                    });
                });
            }

            console.log('\n🎉 All deployments complete!');
            conn.end();
        });
    }).connect(SERVER);
}

deploy().catch(console.error);
