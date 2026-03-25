const { Client } = require('ssh2'); 
const conn = new Client(); 

const buildCmd = `#!/bin/bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  (
    echo "Starting Sidebar Hotfix n$i"
    cd /www/wwwroot/n$i.namainvist.com
    npm run build
    pm2 restart n$i --update-env
    echo "Completed Sidebar Hotfix n$i"
  ) > /root/deploy_sidebar_n$i.log 2>&1
done
`;

conn.on('ready', () => { 
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        try {
            console.log('Uploading Sidebar.tsx to all 10 servers...');
            let proms = [];
            for(let i=1; i<=10; i++) {
                proms.push(new Promise((r, j) => sftp.fastPut('d:/namasoft9-3-main/src/components/Sidebar.tsx', '/www/wwwroot/n'+i+'.namainvist.com/src/components/Sidebar.tsx', e => e?j(e):r())));
            }
            await Promise.all(proms);
            console.log('Upload complete. Triggering SEQUENTIAL Sidebar builds...');
            
            // NOTICE: Removed '&' from the inner loop. We will build sequentially to protect the CPU!
            conn.exec(`cat << 'EOF' > /root/deploy_sidebar.sh\n${buildCmd}\nEOF\nnohup bash /root/deploy_sidebar.sh > /root/sidebar_master.log 2>&1 &`, (err, stream) => { 
                if (err) throw err; 
                stream.on('close', () => {
                    console.log('SEQUENTIAL Sidebar deployment triggered successfully on all nodes.');
                    conn.end();
                });
            });
        } catch(e) { console.error(e); conn.end(); }
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
