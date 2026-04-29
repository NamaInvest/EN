const { Client } = require('ssh2');

const files = [
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\lib\\i18n.tsx', remotePath: 'src/lib/i18n.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\restaurant-pos\\page.tsx', remotePath: 'src/app/restaurant-pos/page.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\master\\route.ts', remotePath: 'src/app/api/master/route.ts' },
];

console.log('Initiating i18n & Restaurant POS PUSH to ALL Nodes...');
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
            console.log(`📡 Distributing to ${targetServersList.length} nodes...`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`[${serverName}] Uploading i18n patches...`);
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
                                console.log(`✅ [${serverName}] Next.js Build Finished. Exit: ${code}`);
                                resolve();
                            });
                        });
                    });
                }
                console.log('\n💎 GLOBAL LINGUISTIC PATCH COMPLETED SUCCESSFULLY!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
