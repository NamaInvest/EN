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
    console.log('Initiating deployment of Price Quotes Modernization & Master Center fixes to ALL server nodes...');
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
                
                // Target all servers dynamically! n1, n2, ..., n15
                let targetServers = processes.filter(p => p.name.match(/^n\d+$/));
                console.log(`📡 Found ${targetServers.length} dynamic nodes to deploy to: ${targetServers.map(s => s.name).join(', ')}`);

                conn.sftp(async (sftpErr, sftp) => {
                    if (sftpErr) throw sftpErr;
                    
                    const promises = targetServers.map((server, i) => new Promise(async (resolve, reject) => {
                        // Stagger deployments slightly to prevent CPU overload
                        await new Promise(r => setTimeout(r, i * 8000));
                        
                        const pmCwd = server.pm2_env.pm_cwd;
                        const serverName = server.name;
                        
                        console.log(`[${serverName}] Starting deployment at ${pmCwd}...`);
                        
                        try {
                            for (const file of FILES_TO_DEPLOY) {
                                const rDir = `${pmCwd}/${file.remoteDir}`;
                                const rPath = `${rDir}/${file.remoteName}`;
                                
                                await new Promise((res, rej) => {
                                    conn.exec(`mkdir -p "${rDir}"`, (mkdirErr, mkdirStream) => {
                                        mkdirStream.on('close', () => {
                                            sftp.fastPut(file.local, rPath, errPut => {
                                                if (errPut) return rej(errPut);
                                                res();
                                            });
                                        });
                                    });
                                });
                            }
                            console.log(`[${serverName}] Files uploaded. Rebuilding Next.js...`);
                            
                            // Execute the build and restart
                            await new Promise((res, rej) => {
                                conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                                    if(execErr) return rej(execErr);
                                    execStream.on('close', () => {
                                        console.log(`✅ [${serverName}] Rebuild and restart complete!`);
                                        res();
                                    });
                                });
                            });
                            resolve();
                        } catch (e) {
                            console.log(`❌ [${serverName}] Failed: ${e.message}`);
                            reject(e);
                        }
                    }));
                    
                    try {
                        await Promise.allSettled(promises);
                        console.log('\n🌟 DYNAMIC DEPLOYMENT TO ALL NODES COMPLETED SUCCESSFULLY!');
                    } catch (e) {
                        console.log('Error during parallel deployment', e);
                    }
                    conn.end();
                });
            });
        });
    }).connect(SSH_CONFIG);
}

deployFix().catch(console.error);
