const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const filesToDeploy = [
    'src/app/api/pos/checkout/route.ts',
    'src/app/pos/page.tsx',
    'src/app/restaurant-pos/page.tsx',
    'src/app/login/page.tsx',
    'src/app/onboarding/provisioning/page.tsx',
    'src/app/onboarding/zatca/page.tsx',
    'src/app/page.tsx',
    'src/app/(dashboard)/sales/history/page.tsx',
    'src/components/Sidebar.tsx'
];

async function deployToAllSaaS() {
    console.log("🚀 Initiating Targeted Phase 84 Sync to SaaS Cluster (n1 - n10)");

    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);
                
                try {
                    console.log('Synchronizing targeted files across all 10 production shards...');
                    for(let i = 1; i <= 10; i++) {
                        const t = 'n' + i;
                        const rootPath = `/www/wwwroot/${t}.namainvist.com`;
                        
                        console.log(`📡 Uploading to tenant ${t}...`);

                        for (let j = 0; j < filesToDeploy.length; j++) {
                            const localPath = filesToDeploy[j].replace(/\\/g, '/'); // ensure standard path formatting
                            const remotePath = `${rootPath}/${localPath}`;
                            const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
                            
                            await new Promise((res, rej) => {
                                conn.exec(`mkdir -p "${remoteDir}"`, (err, stream) => {
                                    if (err) return rej(err);
                                    stream.on('close', () => {
                                        sftp.fastPut(localPath, remotePath, e => {
                                            if(e) console.error(`Failed to PUT ${localPath} into ${remotePath}`, e);
                                            e ? rej(e) : res();
                                        });
                                    });
                                    stream.resume();
                                });
                            });
                        }
                        
                        console.log(`✅ Tenant ${t} synchronized.`);
                    }

                    console.log("\n🔄 Triggering global concurrent compilation and restart (Next.js Build & PM2)...");
                    const buildCmd = [
                        'for i in {1..10}; do',
                        '  (',
                        '    cd /www/wwwroot/n$i.namainvist.com;',
                        '    npm run build;',
                        '    pm2 restart n$i --update-env;',
                        '  ) > /root/build_n$i_phase84_hotfix.log 2>&1 &',
                        'done'
                    ].join(' ');
                    
                    conn.exec(buildCmd, (err, stream) => {
                        if (err) throw err;
                        stream.resume();
                        stream.on('close', () => {
                            console.log("🎉 Successfully deployed! Servers from n1 to n10 are compiling in the background.");
                            conn.end();
                            resolve();
                        });
                    });

                } catch (e) {
                    console.error('SFTP/Upload Phase Error:', e);
                    conn.end();
                    reject(e);
                }
            });
        }).on('error', reject).connect({
            host: '46.4.188.170', 
            port: 22, 
            username: 'root', 
            password: '_ee4SWbxLVfH9b', 
            readyTimeout: 20000
        });
    });
}

deployToAllSaaS().catch(e => console.error("Critical Failure:", e));
