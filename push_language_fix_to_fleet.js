const { Client } = require('ssh2');

const files = [
    { local: 'd:\\namasoft9-3-main\\src\\lib\\i18n.tsx', remotePath: 'src/lib/i18n.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\components\\LanguageSwitcher.tsx', remotePath: 'src/components/LanguageSwitcher.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\components\\Providers.tsx', remotePath: 'src/components/Providers.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\layout.tsx', remotePath: 'src/app/layout.tsx' }
];

console.log('Initiating Language SSR Fix Deployment to ALL Fleet Nodes N1-N10...');
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
            
            // Get all N1-N10 servers active in PM2
            let targetServersList = processes.filter(p => p && p.name && p.name.match(/^n\d+$/)).filter(p => { let n = parseInt(p.name.replace('n','')); return n >= 1 && n <= 10; }).sort((a,b) => parseInt(a.name.replace('n','')) - parseInt(b.name.replace('n','')));
            console.log(`📡 Distributing to ${targetServersList.length} nodes: ${targetServersList.map(s => s.name).join(', ')} ...`);

            conn.sftp(async (sftpErr, sftp) => {
                if (sftpErr) throw sftpErr;
                
                for (const server of targetServersList) {
                    const pmCwd = server.pm2_env.pm_cwd;
                    const serverName = server.name;
                    
                    console.log(`[${serverName}] Uploading Language SSR patches to ${pmCwd}...`);
                    for(const file of files) {
                        const rPath = `${pmCwd}/${file.remotePath}`;
                        await new Promise((resolve, reject) => {
                            sftp.fastPut(file.local, rPath, errPut => {
                                if (errPut) console.error(`[${serverName}] Failed to upload ${file.local}: ${errPut.message}`);
                                resolve();
                            });
                        });
                    }
                    
                    console.log(`[${serverName}] Files Uploaded!`);
                }
                
                console.log('Upload complete. Triggering background parallel builds across all nodes...');
                
                const buildCmd = `#!/bin/bash
for i in {1..10}; do
  (
    echo "Starting Language SSR compilation for n$i"
    cd /www/wwwroot/n$i.namainvist.com
    npm run build
    pm2 restart n$i
    echo "Completed Language SSR for n$i"
  ) > /root/hotfix_lang_ssr_n$i.log 2>&1 &
done
`;
                conn.exec(`cat << 'EOF' > /root/hotfix_lang_ssr.sh\n${buildCmd}\nEOF\nbash /root/hotfix_lang_ssr.sh`, (err, stream) => { 
                    if (err) throw err; 
                    stream.on('close', () => {
                        console.log('✅ Parallel builds triggered successfully on all N1-N10 nodes.');
                        console.log('💎 GLOBAL LINGUISTIC SSR PATCH DEPLOYED! (Monitor server /root/hotfix_lang_ssr_n*.log)');
                        conn.end();
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
