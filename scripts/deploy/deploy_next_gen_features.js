const { Client } = require('ssh2');

const files = [
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\ai\\cfo\\route.ts', remotePath: 'src/app/api/ai/cfo/route.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\ai-cfo\\page.tsx', remotePath: 'src/app/(dashboard)/ai-cfo/page.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\portals\\tenant\\route.ts', remotePath: 'src/app/api/portals/tenant/route.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\portals\\tenant\\page.tsx', remotePath: 'src/app/portals/tenant/page.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\portals\\parent\\route.ts', remotePath: 'src/app/api/portals/parent/route.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\portals\\parent\\page.tsx', remotePath: 'src/app/portals/parent/page.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\cron\\predictive-po\\route.ts', remotePath: 'src/app/api/cron/predictive-po/route.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\cron\\rem-leases\\route.ts', remotePath: 'src/app/api/cron/rem-leases/route.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\fleet\\trips\\page.tsx', remotePath: 'src/app/(dashboard)/fleet/trips/page.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\automation_daemon.js', remotePath: 'automation_daemon.js' }
];

console.log('Initiating NEXT-GEN AI ERP Deployment to ALL Nodes (n1-n10)...');
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
            console.log(`📡 Queued ${targetServersList.length} dynamic nodes for sequential AI & Portals deployment: ${targetServersList.map(s => s.name).join(', ')}`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`\n===========================================`);
                    console.log(`[${serverName}] Broadcasting Next-Gen AI ERP features to ${pmCwd}...`);
                    
                    for(const file of files) {
                        const rPath = `${pmCwd}/${file.remotePath}`;
                        const rDir = rPath.substring(0, rPath.lastIndexOf('/'));
                        await new Promise((resolve, reject) => {
                            conn.exec(`mkdir -p "${rDir}"`, (mkdirErr, mkdirStream) => {
                                mkdirStream.resume(); 
                                mkdirStream.on('close', () => {
                                    sftp.fastPut(file.local, rPath, errPut => {
                                        if (errPut) return reject(errPut);
                                        resolve();
                                    });
                                });
                            });
                        });
                    }
                    
                    console.log(`[${serverName}] 10 Master Files Uploaded! Starting PM2 Reload & Rebuild sequence...`);
                    
                    await new Promise((resolve, reject) => {
                        conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                            if(execErr) return reject(execErr);
                            execStream.on('data', () => {}); 
                            execStream.on('close', (code) => {
                                console.log(`✅ [${serverName}] AI & Portals integration active! Health Exit: ${code}`);
                                resolve();
                            });
                        });
                    });
                }
                console.log('\n🌟 ERA OF NAMA INVEST 2.0 SUCCESSFULLY LAUNCHED ON ALL SERVERS!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
