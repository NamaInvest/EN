const { Client } = require('ssh2'); 
const conn = new Client(); 

const buildCmd = `#!/bin/bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  (
    echo "Starting Account Seed & Build n$i"
    cd /www/wwwroot/n$i.namainvist.com
    node seed_accounts.js
    npm run build
    pm2 restart n$i --update-env
    echo "Completed accounts & build n$i"
  ) > /root/deploy_accounts_n$i.log 2>&1 &
done
`;

conn.on('ready', () => { 
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        try {
            console.log('Uploading COA and PrintButtons to all 10 servers...');
            let proms = [];
            for(let i=1; i<=10; i++) {
                proms.push(new Promise((r, j) => sftp.fastPut('d:/namasoft9-3-main/src/components/PrintButton.tsx', '/www/wwwroot/n'+i+'.namainvist.com/src/components/PrintButton.tsx', e => e?j(e):r())));
                proms.push(new Promise((r, j) => sftp.fastPut('d:/namasoft9-3-main/src/app/(dashboard)/layout.tsx', '/www/wwwroot/n'+i+'.namainvist.com/src/app/(dashboard)/layout.tsx', e => e?j(e):r())));
                proms.push(new Promise((r, j) => sftp.fastPut('d:/namasoft9-3-main/accounts_payload.json', '/www/wwwroot/n'+i+'.namainvist.com/accounts_payload.json', e => e?j(e):r())));
                proms.push(new Promise((r, j) => sftp.fastPut('d:/namasoft9-3-main/seed_accounts.js', '/www/wwwroot/n'+i+'.namainvist.com/seed_accounts.js', e => e?j(e):r())));
            }
            await Promise.all(proms);
            console.log('Upload complete. Triggering background seeder + builds...');
            
            conn.exec(`cat << 'EOF' > /root/deploy_accounts.sh\n${buildCmd}\nEOF\nbash /root/deploy_accounts.sh`, (err, stream) => { 
                if (err) throw err; 
                stream.on('close', () => {
                    console.log('Accounts deployment triggered successfully on all nodes.');
                    conn.end();
                });
            });
        } catch(e) { console.error(e); conn.end(); }
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
