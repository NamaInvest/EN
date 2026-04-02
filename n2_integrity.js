const { Client } = require('ssh2');

const files = [
    { local: 'd:\\namasoft9-3-main\\src\\lib\\i18n.tsx', remotePath: 'src/lib/i18n.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\components\\Sidebar.tsx', remotePath: 'src/components/Sidebar.tsx' }
];

console.log('Initiating N2 Integrity Deep Scan & Push...');
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
            
            let targetServer = processes.find(p => p.name === 'n2');
            if(!targetServer) return conn.end();

            console.log(`[n2] Pushing fresh translations and validating...`);
            const pmCwd = targetServer.pm2_env.pm_cwd;

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for(const file of files) {
                    const rPath = `${pmCwd}/${file.remotePath}`;
                    await new Promise((resolve) => sftp.fastPut(file.local, rPath, () => resolve()));
                }
                
                console.log(`[n2] Verification: running grep...`);
                await new Promise((resolve) => {
                    const cmd = `cd ${pmCwd} && grep "Products & Services" src/lib/i18n.tsx && rm -rf .next/cache && npm run build && pm2 restart n2`;
                    conn.exec(cmd, (execErr, execStream) => {
                        execStream.on('data', (d) => process.stdout.write(d)); 
                        execStream.on('close', (code) => {
                            console.log(`✅ [n2] Rebuilt bypassing Next.js cache. Exit: ${code}`);
                            resolve();
                        });
                    });
                });
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
