const { Client } = require('ssh2');

const file = {
    local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\purchases\\rfq\\route.ts',
    remoteDir: 'src/app/api/purchases/rfq',
    remoteName: 'route.ts'
};

console.log('Initiating SAFE Sequential Deployment of RFQ Hotfix to ALL Remaining N Nodes...');
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
            
            // Get all active node instances except n1 which is already updated
            let targetServersFilter = processes.filter(p => p.name.match(/^n\d+$/) && p.name !== 'n1');
            console.log(`📡 Queued ${targetServersFilter.length} dynamic nodes for sequential deployment: ${targetServersFilter.map(s => s.name).join(', ')}`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersFilter) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`\n===========================================`);
                    console.log(`[${serverName}] Uploading RFQ API hotfix to ${pmCwd}...`);
                    
                    const rDir = `${pmCwd}/${file.remoteDir}`;
                    const rPath = `${rDir}/${file.remoteName}`;
                    
                    await new Promise((resolve, reject) => {
                        conn.exec(`mkdir -p "${rDir}"`, (mkdirErr, mkdirStream) => {
                            mkdirStream.resume(); // Consumer to prevent stream deadlock
                            mkdirStream.on('close', () => {
                                sftp.fastPut(file.local, rPath, errPut => {
                                    if (errPut) return reject(errPut);
                                    resolve();
                                });
                            });
                        });
                    });
                    
                    console.log(`[${serverName}] File uploaded successfully. Rebuilding Next.js...`);
                    
                    await new Promise((resolve, reject) => {
                        conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                            if(execErr) return reject(execErr);
                            execStream.on('data', d => {
                                const str = d.toString().trim();
                                if (str.includes('Next.js') || str.includes('Creating an optimized production')) {
                                    console.log(`[${serverName}] build status: ${str}`);
                                }
                            });
                            execStream.on('close', () => {
                                console.log(`✅ [${serverName}] Rebuild and restart complete!`);
                                resolve();
                            });
                        });
                    });
                }
                console.log('\n🌟 ALL REMAINING SERVERS UPDATED WITH RFQ HOTFIX SUCCESSFULLY!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
