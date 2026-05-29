const { Client } = require('ssh2');
const fs = require('fs');

const files = [
    'src/components/GlobalErrorBoundary.tsx',
    'src/app/(dashboard)/layout.tsx',
    'src/app/(dashboard)/master-panel/page.tsx',
    'src/app/(dashboard)/settings/page.tsx',
    'src/app/(dashboard)/crm/leads/page.tsx'
];

async function push() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);
                
                try {
                    for (let i = 1; i <= 10; i++) {
                        const tenant = `n${i}`;
                        console.log(`Uploading to ${tenant}...`);
                        
                        for (const f of files) {
                            const local = `c:/Users/1/Desktop/alfa/${f}`;
                            const remote = `/www/wwwroot/${tenant}.namainvist.com/${f}`;
                            
                            await new Promise((res, rej) => {
                                sftp.fastPut(local, remote, (err) => {
                                    if (err) return rej(new Error(`Failed ${remote}: ${err.message}`));
                                    res();
                                });
                            });
                        }
                    }
                    console.log("Uploads finished. Triggering background builds on server...");
                    
                    const shellScript = `#!/bin/bash
for i in {1..10}
do
  (
    cd /www/wwwroot/n$i.namainvist.com
    npm run build > build_api.log 2>&1
    pm2 restart n$i --update-env
    pm2 restart n$i-whatsapp --update-env
  ) &
done
wait
echo "ALL BUILDS COMPLETED"
`;
                    fs.writeFileSync('c:/Users/1/Desktop/alfa/build_all_temp.sh', shellScript);
                    
                    await new Promise((res, rej) => {
                        sftp.fastPut('c:/Users/1/Desktop/alfa/build_all_temp.sh', '/root/build_all.sh', (err) => {
                            if (err) return rej(err);
                            res();
                        });
                    });
                    
                    conn.exec(`chmod +x /root/build_all.sh && nohup /root/build_all.sh > /root/build_output.log 2>&1 &`, (err, stream) => {
                        if (err) return reject(err);
                        console.log("Commands triggered!");
                        stream.on('close', () => {
                            console.log("Connection closing.");
                            conn.end();
                            resolve();
                        });
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject).connect({
            host: '46.4.188.170',
            port: 22,
            username: 'root',
            password: 'process.env.SSH_PASSWORD',
            readyTimeout: 20000,
            keepaliveInterval: 10000
        });
    });
}

push().then(() => console.log('Deploy success!')).catch(e => console.error('DEPLOY ERROR:', e));
