const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const LOCAL_ROUTE_PATH = 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\purchases\\ocr\\route.ts';

// Get target servers from command line, e.g. "node deploy_ocr_all.js n2 n3 n4"
// If none provided, it automatically fetches ALL running nX servers from pm2
const specificServers = process.argv.slice(2);

async function deployToAll() {
    console.log('Initiating generalized deployment script...');
    const conn = new Client();
    conn.on('ready', () => {
        console.log('SSH connection established. Fetching active PM2 servers...');
        conn.exec('pm2 jlist', (err, stream) => {
            if (err) throw err;
            let output = '';
            stream.on('data', d => output += d);
            stream.on('close', async () => {
                let processes = [];
                try {
                    // Sometimes pm2 jlist outputs non-JSON warnings before the array. Quick cleanup:
                    const jsonStart = output.indexOf('[');
                    const jsonEnd = output.lastIndexOf(']') + 1;
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        processes = JSON.parse(output.substring(jsonStart, jsonEnd));
                    }
                } catch(e) {
                    console.error('Failed to parse PM2 list.');
                    conn.end();
                    return;
                }
                
                let targetServers = processes.filter(p => /^n\d+$/.test(p.name));
                
                // If user specified specific servers via arguments
                if (specificServers.length > 0) {
                    targetServers = targetServers.filter(p => specificServers.includes(p.name));
                } else {
                    // Skip n1 automatically if running for all, since we already did n1
                    targetServers = targetServers.filter(p => p.name !== 'n1');
                }
                
                // Sort them numerically n2, n3, n4...
                targetServers.sort((a,b) => parseInt(a.name.slice(1)) - parseInt(b.name.slice(1)));

                console.log(`Found ${targetServers.length} target servers: ${targetServers.map(s => s.name).join(', ')}`);
                if (targetServers.length === 0) {
                    console.log("No servers to update.");
                    conn.end();
                    return;
                }
                
                conn.sftp(async (sftpErr, sftp) => {
                    if (sftpErr) throw sftpErr;
                    
                    for (const server of targetServers) {
                        const pmCwd = server.pm2_env.pm_cwd;
                        const remoteFilePath = `${pmCwd}/src/app/api/purchases/ocr/route.ts`;
                        const serverName = server.name;
                        
                        console.log(`\n===========================================`);
                        console.log(`Deploying OCR fix to ${serverName} at ${pmCwd}...`);
                        
                        await new Promise((resolve, reject) => {
                             sftp.fastPut(LOCAL_ROUTE_PATH, remoteFilePath, errPut => {
                                 if (errPut) return reject(errPut);
                                 console.log(`[${serverName}] File uploaded successfully. Rebuilding Next.js (Sequential)...`);
                                 
                                 // Execute the build and restart
                                 conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                                     if(execErr) return reject(execErr);
                                     
                                     execStream.on('data', d => {
                                        const str = d.toString().trim();
                                        if (str.includes('Next.js') || str.includes('Creating an optimized') || str.includes('Restarting app')) {
                                            console.log(`[${serverName}] build status: ${str}`);
                                        }
                                     });
                                     
                                     execStream.stderr.on('data', d => {
                                         // Filter out annoying warnings
                                        const str = d.toString().trim();
                                        if(!str.includes('deprecated') && !str.includes('notice')) {
                                            process.stdout.write(`[${serverName} ERR] ` + str + '\n');
                                        }
                                     });

                                     execStream.on('close', () => {
                                        console.log(`✅ [${serverName}] Rebuild and restart complete!`);
                                        resolve();
                                     });
                                 });
                             });
                        });
                    }
                    console.log('\n===========================================');
                    console.log('🌟 ALL SERVERS DEPLOYED SUCCESSFULLY!');
                    console.log('===========================================');
                    conn.end();
                });
            });
        });
    }).connect(SSH_CONFIG);
}

deployToAll().catch(console.error);
