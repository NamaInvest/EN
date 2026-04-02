const { Client } = require('ssh2');

const files = [
    { local: 'd:\\namasoft9-3-main\\src\\components\\StockNotificationBell.tsx', remotePath: 'src/components/StockNotificationBell.tsx' }
];

console.log('Initiating Hotfix Deployment to ALL Nodes (n1-n10)...');
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

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    for(const file of files) {
                        const rPath = `${pmCwd}/${file.remotePath}`;
                        await new Promise((resolve) => sftp.fastPut(file.local, rPath, () => resolve()));
                    }
                    console.log(`[${serverName}] Hotfix Uploaded! Restarting Next.js Build...`);
                    await new Promise((resolve) => {
                        conn.exec(`cd ${pmCwd} && npm run build && pm2 restart ${serverName}`, () => resolve());
                    });
                }
                console.log('HOTFIX DEPLOYED.');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
