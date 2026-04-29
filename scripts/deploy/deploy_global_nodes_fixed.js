const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const FILES_TO_DEPLOY = [
    {
        local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\price-quotes\\page.tsx',
        remoteDir: 'src/app/(dashboard)/price-quotes',
        remoteName: 'page.tsx'
    },
    {
        local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\price-quotes\\route.ts',
        remoteDir: 'src/app/api/price-quotes',
        remoteName: 'route.ts'
    },
    {
        local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\master\\page.tsx',
        remoteDir: 'src/app/master',
        remoteName: 'page.tsx'
    },
    {
        local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\master\\route.ts',
        remoteDir: 'src/app/api/master',
        remoteName: 'route.ts'
    }
];

async function deployFix() {
    console.log('Initiating SAFE Sequential Deployment of Price Quotes to ALL N Nodes...');
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
                let targetServers = processes.filter(p => p.name.match(/^n[2-9]$|^n1[0-9]+$/));
                // Wait! To be absolutely safe and avoid omitting new ones like n10, n11, regex is better:
                let targetServersFilter = processes.filter(p => p.name.match(/^n\d+$/) && p.name !== 'n1');
                console.log(`📡 Queued ${targetServersFilter.length} dynamic nodes for sequential deployment: ${targetServersFilter.map(s => s.name).join(', ')}`);

                conn.sftp(async (sftpErr, sftp) => {
                    if (sftpErr) throw sftpErr;
                    
                    for (const server of targetServersFilter) {
                        const pmCwd = server.pm2_env.pm_cwd;
                        const serverName = server.name;
                        
                        console.log(`\n===========================================`);
                        console.log(`[${serverName}] Starting deployment at ${pmCwd}...`);
                        
                        for (const file of FILES_TO_DEPLOY) {
                            const rDir = `${pmCwd}/${file.remoteDir}`;
                            const rPath = `${rDir}/${file.remoteName}`;
                            
                            await new Promise((resolve, reject) => {
                                conn.exec(`mkdir -p "${rDir}"`, (mkdirErr, mkdirStream) => {
                                    mkdirStream.resume(); // Consumer to prevent stream deadlock
                                    mkdirStream.on('close', () => {
                                        sftp.fastPut(file.local, rPath, errPut => {
                                            if (errPut) {
                                                console.error(`[${serverName}] SFTP FastPut failed: `, errPut);
                                                return reject(errPut);
                                            }
                                            resolve();
                                        });
                                    });
                                });
                            });
                        }
                        
                        console.log(`[${serverName}] Files uploaded successfully. Rebuilding Next.js (Safe Sequential)...`);
                        
                        await new Promise((resolve, reject) => {
                            conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                                if(execErr) return reject(execErr);
                                execStream.on('data', d => {
                                    const str = d.toString().trim();
                                    if (str.includes('Next.js') || str.includes('Creating an optimized production build') || str.includes('Restarting app')) {
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
                    console.log('\n🌟 ALL REMAINING SERVERS UPDATED SUCCESSFULLY!');
                    conn.end();
                });
            });
        });
    }).connect(SSH_CONFIG);
}

deployFix().catch(console.error);
