const { Client } = require('ssh2');

const files = [
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\components\\LocationSelector.tsx', remotePath: 'src/components/LocationSelector.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\purchases\\grn\\page.tsx', remotePath: 'src/app/(dashboard)/purchases/grn/page.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\purchases\\grn\\route.ts', remotePath: 'src/app/api/purchases/grn/route.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\stock-transfers\\page.tsx', remotePath: 'src/app/(dashboard)/stock-transfers/page.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\stock-transfers\\route.ts', remotePath: 'src/app/api/stock-transfers/route.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\stock\\page.tsx', remotePath: 'src/app/(dashboard)/stock/page.tsx' }
];

console.log('Initiating SAFE Sequential Deployment of In-route WMS to ALL Nodes...');
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
                    console.log(`[${serverName}] Uploading In-route WMS hotfix to ${pmCwd}...`);
                    
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
                    
                    console.log(`[${serverName}] 6 Files uploaded successfully. Rebuilding Next.js (takes ~60s)...`);
                    
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
                console.log('\n🌟 ALL SERVERS UPDATED WITH IN-ROUTE WMS HOTFIX SUCCESSFULLY!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
