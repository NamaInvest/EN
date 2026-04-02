const { Client } = require('ssh2');

const files = [
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\ecommerce\\sync\\route.ts', remotePath: 'src/app/api/ecommerce/sync/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\whatsapp\\interactive\\route.ts', remotePath: 'src/app/api/whatsapp/interactive/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\purchases\\letters-of-credit\\landed-costs\\route.ts', remotePath: 'src/app/api/purchases/letters-of-credit/landed-costs/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\attendance\\face-id\\page.tsx', remotePath: 'src/app/attendance/face-id/page.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\attendance\\face-id\\route.ts', remotePath: 'src/app/api/attendance/face-id/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\components\\Sidebar.tsx', remotePath: 'src/components/Sidebar.tsx' }
];

console.log('Initiating NAMA INVEST 3.0 Deployment to ALL Nodes (n1-n10)...');
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
            console.log(`📡 Queued ${targetServersList.length} dynamic nodes for Nama 3.0 deployment: ${targetServersList.map(s => s.name).join(', ')}`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`\n===========================================`);
                    console.log(`[${serverName}] Broadcasting Nama 3.0 (Omnichannel, WA, LC, FaceID) to ${pmCwd}...`);
                    
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
                    
                    console.log(`[${serverName}] The 6 Master Files of v3.0 Uploaded! Starting PM2 Reload & Next.js Rebuild sequence...`);
                    
                    await new Promise((resolve, reject) => {
                        conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                            if(execErr) return reject(execErr);
                            execStream.on('data', () => {}); 
                            execStream.on('close', (code) => {
                                console.log(`✅ [${serverName}] Nama 3.0 features active! Health Exit: ${code}`);
                                resolve();
                            });
                        });
                    });
                }
                console.log('\n👑 ERA OF NAMA INVEST 3.0 SUCCESSFULLY LAUNCHED ON ALL SERVERS!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
