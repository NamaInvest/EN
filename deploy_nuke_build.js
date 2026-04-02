const { Client } = require('ssh2');

const files = [
    { local: 'd:\\namasoft9-3-main\\src\\lib\\i18n.tsx', remotePath: 'src/lib/i18n.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\components\\LanguageSwitcher.tsx', remotePath: 'src/components/LanguageSwitcher.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\components\\Sidebar.tsx', remotePath: 'src/components/Sidebar.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\globals.css', remotePath: 'src/app/globals.css' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\layout.tsx', remotePath: 'src/app/(dashboard)/layout.tsx' }
];

console.log('Initiating COLD NUKE deployment to ALL Nodes...');
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
            
            let targetServersList = processes.filter(p => !!(p && p.name && p.name.match(/^n([1-9]|10)$/))).sort((a,b) => parseInt(a.name.replace('n','')) - parseInt(b.name.replace('n','')));
            
            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`\n============================`);
                    console.log(`[${serverName}] Uploading files...`);
                    for(const file of files) {
                        const rPath = `${pmCwd}/${file.remotePath}`;
                        await new Promise((resolve) => sftp.fastPut(file.local, rPath, () => resolve()));
                    }
                    console.log(`[${serverName}] NUKING .next and rebuilding...`);
                    
                    await new Promise((resolve) => {
                        conn.exec(`cd ${pmCwd} && rm -rf .next && npm run build && pm2 restart ${serverName}`, (execErr, execStream) => {
                            execStream.on('data', () => {}); 
                            execStream.on('close', (code) => {
                                console.log(`✅ [${serverName}] Nuke Build SUCCESSFUL! Code: ${code}`);
                                resolve();
                            });
                        });
                    });
                }
                
                console.log('\n💎 GLOBAL NUKE FINISHED!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
