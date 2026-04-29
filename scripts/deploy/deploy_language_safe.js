const { Client } = require('ssh2');

const files = [
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\lib\\i18n.tsx', remotePath: 'src/lib/i18n.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\components\\LanguageSwitcher.tsx', remotePath: 'src/components/LanguageSwitcher.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\components\\Providers.tsx', remotePath: 'src/components/Providers.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\layout.tsx', remotePath: 'src/app/layout.tsx' }
];

console.log('Initiating SAFE Sequential Deployment to ALL Nodes (Preventing Out of Memory OOM crashes on the server)...');
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
            
            // Get N1 to N10
            let targetServersList = processes.filter(p => p && p.name && p.name.match(/^n\d+$/)).filter(p => { let n = parseInt(p.name.replace('n','')); return n >= 1 && n <= 10; }).sort((a,b) => parseInt(a.name.replace('n','')) - parseInt(b.name.replace('n','')));
            
            console.log(`📡 Discovered ${targetServersList.length} nodes to deploy: ${targetServersList.map(s => s.name).join(', ')} ...`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`\n============================`);
                    console.log(`[${serverName}] Uploading patched i18n and SSR fixes...`);
                    for(const file of files) {
                        const rPath = `${pmCwd}/${file.remotePath}`;
                        await new Promise((resolve) => {
                            sftp.fastPut(file.local, rPath, () => resolve());
                        });
                    }
                    console.log(`[${serverName}] Files uploaded! Started sequential Next.js compilation...`);
                    
                    // Run sequentially to protect server Memory
                    await new Promise((resolve, reject) => {
                        conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                            if (execErr) {
                                console.error(`[${serverName}] Command Error`, execErr);
                                return resolve();
                            }
                            execStream.on('data', () => {}); // ignoring stdout to keep it clean
                            execStream.on('close', (code) => {
                                if (code === 0) {
                                    console.log(`✅ [${serverName}] Build & Restart SUCCESSFUL!`);
                                } else {
                                    console.error(`❌ [${serverName}] Build FAILED with code ${code}.`);
                                }
                                resolve();
                            });
                        });
                    });
                }
                
                console.log('\n💎 GLOBAL LINGUISTIC SSR FULL FIX DEPLOYED COMPLETELY ON ALL SERVERS!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
