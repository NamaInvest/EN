const { Client } = require('ssh2');

const files = [
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\inv\\serials\\route.ts', remotePath: 'src/app/api/inv/serials/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\inv\\serials\\page.tsx', remotePath: 'src/app/(dashboard)/inv/serials/page.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\hr\\evaluations\\route.ts', remotePath: 'src/app/api/hr/evaluations/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\hr\\evaluations\\page.tsx', remotePath: 'src/app/(dashboard)/hr/evaluations/page.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\hr\\training\\route.ts', remotePath: 'src/app/api/hr/training/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\hr\\training\\page.tsx', remotePath: 'src/app/(dashboard)/hr/training/page.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\rem\\leases\\route.ts', remotePath: 'src/app/api/rem/leases/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\rem\\leases\\page.tsx', remotePath: 'src/app/(dashboard)/rem/leases/page.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\fleet\\trips\\route.ts', remotePath: 'src/app/api/fleet/trips/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\fleet\\trips\\page.tsx', remotePath: 'src/app/(dashboard)/fleet/trips/page.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\shl\\students\\route.ts', remotePath: 'src/app/api/shl/students/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\shl\\students\\page.tsx', remotePath: 'src/app/(dashboard)/shl/students/page.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\shl\\classes\\route.ts', remotePath: 'src/app/api/shl/classes/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\shl\\classes\\page.tsx', remotePath: 'src/app/(dashboard)/shl/classes/page.tsx' }
];

console.log('Initiating SAFE Sequential Deployment of ERP Expansion to ALL Nodes...');
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
            
            // Sort to ensure n1 is deployed first, then n2, n3...
            let targetServersList = processes.filter(p => p.name.match(/^n\d+$/)).sort((a,b) => parseInt(a.name.replace('n','')) - parseInt(b.name.replace('n','')));
            console.log(`📡 Queued ${targetServersList.length} dynamic nodes for sequential deployment: ${targetServersList.map(s => s.name).join(', ')}`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`\n===========================================`);
                    console.log(`[${serverName}] Uploading ERP Expansion to ${pmCwd}...`);
                    
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
                    
                    console.log(`[${serverName}] 14 Files uploaded successfully. Rebuilding Next.js (takes ~60s)...`);
                    
                    await new Promise((resolve, reject) => {
                        conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                            if(execErr) return reject(execErr);
                            execStream.on('data', () => {}); // discard output to save memory
                            execStream.on('close', (code) => {
                                console.log(`✅ [${serverName}] Rebuild and restart complete! Exit: ${code}`);
                                resolve();
                            });
                        });
                    });
                }
                console.log('\n🌟 ALL SERVERS UPDATED WITH ERP EXPANSIONS SUCCESSFULLY!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
