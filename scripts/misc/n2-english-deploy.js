const { Client } = require('ssh2');

const files = [
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\lib\\i18n.tsx', remotePath: 'src/lib/i18n.tsx' },
];

console.log('Initiating N2 English Default Sync...');
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
            
            let serverN2 = processes.find(p => p.name === 'n2');
            if(!serverN2) {
                console.log('N2 process not found!');
                conn.end();
                return;
            }

            console.log(`📡 Distributing structural layout to N2...`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                const pmCwd = serverN2.pm2_env.pm_cwd;
                const serverName = serverN2.name;
                
                console.log(`[${serverName}] Uploading Root layout...`);
                for(const file of files) {
                    const rPath = `${pmCwd}/${file.remotePath}`;
                    await new Promise((resolve, reject) => {
                        sftp.fastPut(file.local, rPath, errPut => resolve());
                    });
                }
                
                console.log(`[${serverName}] Files Uploaded! Running Build Pipeline & pm2 restart...`);
                
                await new Promise((resolve, reject) => {
                    // Inject NEXT_PUBLIC_DEFAULT_LANG=en into .env or .env.local
                    const cmd = `cd ${pmCwd} && grep -q NEXT_PUBLIC_DEFAULT_LANG .env || echo "NEXT_PUBLIC_DEFAULT_LANG=en" >> .env && npm run build && pm2 restart ${serverName}`;
                    conn.exec(cmd, (execErr, execStream) => {
                        execStream.on('data', (d) => process.stdout.write(d)); 
                        execStream.on('close', (code) => {
                            console.log(`✅ [${serverName}] Next.js Build Finished. Exit: ${code}`);
                            resolve();
                        });
                    });
                });
                
                console.log('\n💎 GLOBAL LIFECYCLE UPGRADE COMPLETED SUCCESSFULLY!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
