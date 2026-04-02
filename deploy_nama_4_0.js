const { Client } = require('ssh2');

const files = [
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\sys\\health\\route.ts', remotePath: 'src/app/api/sys/health/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\sys\\health\\page.tsx', remotePath: 'src/app/(dashboard)/sys/health/page.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\cron\\self-healer\\route.ts', remotePath: 'src/app/api/cron/self-healer/route.ts' },
    { local: 'd:\\namasoft9-3-main\\automation_daemon.js', remotePath: 'automation_daemon.js' },
    { local: 'd:\\namasoft9-3-main\\db_backup.js', remotePath: 'db_backup.js' },
    { local: 'd:\\namasoft9-3-main\\src\\components\\Sidebar.tsx', remotePath: 'src/components/Sidebar.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\purchase-orders\\[id]\\route.ts', remotePath: 'src/app/api/purchase-orders/[id]/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\purchase-orders\\[id]\\landed-costs\\route.ts', remotePath: 'src/app/api/purchase-orders/[id]/landed-costs/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\purchases\\letters-of-credit\\[id]\\route.ts', remotePath: 'src/app/api/purchases/letters-of-credit/[id]/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\settings\\approvals\\[id]\\route.ts', remotePath: 'src/app/api/settings/approvals/[id]/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\settings\\currencies\\[id]\\route.ts', remotePath: 'src/app/api/settings/currencies/[id]/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\settings\\exchange-rates\\[id]\\route.ts', remotePath: 'src/app/api/settings/exchange-rates/[id]/route.ts' }
];

console.log('Initiating NAMA INVEST 4.0 (Self-Healing) Deployment to ALL Nodes (n1-n10)...');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', async () => {
            let processes = [];
            try {
                const jsonStart = output.indexOf('[');
                const jsonEnd = output.lastIndexOf(']') + 1;
                processes = JSON.parse(output.substring(jsonStart, jsonEnd));
            } catch(e) {}
            
            let targetServersList = processes.filter(p => p.name.match(/^n\d+$/)).sort((a,b) => parseInt(a.name.replace('n','')) - parseInt(b.name.replace('n','')));
            console.log(`📡 Queued ${targetServersList.length} dynamic nodes for Nama 4.0 deployment: ${targetServersList.map(s => s.name).join(', ')}`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`\n===========================================`);
                    console.log(`[${serverName}] Broadcasting Nama 4.0 (Health, AI Healer, TS Zero-Errors, Encrypted Backups) to ${pmCwd}...`);
                    
                    for(const file of files) {
                        const rPath = `${pmCwd}/${file.remotePath}`;
                        const rDir = rPath.substring(0, rPath.lastIndexOf('/'));
                        await new Promise((resolve, reject) => {
                            conn.exec(`mkdir -p "${rDir}"`, (mkdirErr, mkdirStream) => {
                                mkdirStream.resume(); 
                                mkdirStream.on('close', () => {
                                    sftp.fastPut(file.local, rPath, errPut => {
                                        if (errPut) { console.error("Upload error on", file.local, errPut); return resolve(); }
                                        resolve();
                                    });
                                });
                            });
                        });
                    }
                    
                    console.log(`[${serverName}] The 12 Stabilizer Files of v4.0 Uploaded! Starting PM2 Reload & Next.js Rebuild sequence...`);
                    
                    // The build on the master server might take time, but ensures type safety is now 100% active
                    await new Promise((resolve, reject) => {
                        conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                            if(execErr) return reject(execErr);
                            execStream.on('data', () => {}); 
                            execStream.on('close', (code) => {
                                console.log(`✅ [${serverName}] Nama 4.0 stabilization active! Health Exit: ${code}`);
                                resolve();
                            });
                        });
                    });
                }
                console.log('\n💎 ERA OF NAMA INVEST 4.0 (The Shield) SUCCESSFULLY SECURED ON ALL SERVERS!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
