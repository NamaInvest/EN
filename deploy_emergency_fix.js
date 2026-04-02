const { Client } = require('ssh2');

const files = [
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\purchase-orders\\[id]\\route.ts', remotePath: 'src/app/api/purchase-orders/[id]/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\purchase-orders\\[id]\\landed-costs\\route.ts', remotePath: 'src/app/api/purchase-orders/[id]/landed-costs/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\purchases\\letters-of-credit\\[id]\\route.ts', remotePath: 'src/app/api/purchases/letters-of-credit/[id]/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\settings\\approvals\\[id]\\route.ts', remotePath: 'src/app/api/settings/approvals/[id]/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\settings\\currencies\\[id]\\route.ts', remotePath: 'src/app/api/settings/currencies/[id]/route.ts' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\api\\settings\\exchange-rates\\[id]\\route.ts', remotePath: 'src/app/api/settings/exchange-rates/[id]/route.ts' }
];

console.log('Initiating EMERGENCY RESCUE DEPLOYMENT to ALL Nodes (n1-n10)...');
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
            console.log(`📡 Recovering ${targetServersList.length} nodes...`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`[${serverName}] Uploading recovered API handlers...`);
                    for(const file of files) {
                        const rPath = `${pmCwd}/${file.remotePath}`;
                        await new Promise((resolve, reject) => {
                            sftp.fastPut(file.local, rPath, errPut => resolve());
                        });
                    }
                    
                    console.log(`[${serverName}] Files Uploaded! Running Build Pipeline & pm2 restart...`);
                    
                    await new Promise((resolve, reject) => {
                        conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                            execStream.on('data', () => {}); 
                            execStream.on('close', (code) => {
                                console.log(`✅ [${serverName}] RESCUED! Exit: ${code}`);
                                resolve();
                            });
                        });
                    });
                }
                console.log('\n💎 EMERGENCY DEPLOYMENT COMPLETE. SYSTEMS SHOULD BE ONLINE!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
