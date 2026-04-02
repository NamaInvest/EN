const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const LOCAL_ROUTE_PATH = 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\sales\\orders\\create\\page.tsx';

async function deployFix() {
    console.log('Initiating contract 404 fix deployment...');
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
                
                // Only target n1 as requested by screenshot initially
                let targetServers = processes.filter(p => p.name === 'n1');

                conn.sftp(async (sftpErr, sftp) => {
                    if (sftpErr) throw sftpErr;
                    
                    for (const server of targetServers) {
                        const pmCwd = server.pm2_env.pm_cwd;
                        const remoteDir = `${pmCwd}/src/app/(dashboard)/sales/orders/create`;
                        const remoteFilePath = `${remoteDir}/page.tsx`;
                        const serverName = server.name;
                        
                        console.log(`\n===========================================`);
                        console.log(`Deploying Contract Page to ${serverName} at ${pmCwd}...`);
                        
                        await new Promise((resolve, reject) => {
                            conn.exec(`mkdir -p "${remoteDir}"`, (mkdirErr, mkdirStream) => {
                                mkdirStream.on('close', () => {
                                    sftp.fastPut(LOCAL_ROUTE_PATH, remoteFilePath, errPut => {
                                        if (errPut) return reject(errPut);
                                        console.log(`[${serverName}] File uploaded. Rebuilding Next.js (Sequential)...`);
                                        
                                        // Execute the build and restart
                                        conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                                            if(execErr) return reject(execErr);
                                            execStream.on('data', d => {
                                                const str = d.toString().trim();
                                                if (str.includes('Next.js') || str.includes('Creating an optimized') || str.includes('Restarting app')) {
                                                    console.log(`[${serverName}] build status: ${str}`);
                                                }
                                            });
                                            execStream.on('close', () => {
                                                console.log(`✅ [${serverName}] Rebuild and restart complete!`);
                                                resolve();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }
                    console.log('\n🌟 FIX APPLIED SUCCESSFULLY!');
                    conn.end();
                });
            });
        });
    }).connect(SSH_CONFIG);
}

deployFix().catch(console.error);
