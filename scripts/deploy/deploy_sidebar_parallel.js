const { Client } = require('ssh2'); 
const conn = new Client(); 

const buildCmd = `#!/bin/bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  (
    echo "Starting PARALLEL Sidebar Hotfix n$i"
    cd /www/wwwroot/n$i.namainvist.com
    npm run build
    pm2 restart n$i --update-env
    echo "Completed PARALLEL Sidebar Hotfix n$i"
  ) > /root/deploy_sidebar_par_n$i.log 2>&1 &
done
`;

conn.on('ready', () => { 
    console.log('Killing old sequential tasks...');
    conn.exec('pkill -f deploy_sidebar.sh', (err) => {
        conn.sftp(async (err, sftp) => {
            if (err) throw err;
            try {
                console.log('Uploading Sidebar.tsx to all 10 servers...');
                let proms = [];
                for(let i=1; i<=10; i++) {
                    proms.push(new Promise((r, j) => sftp.fastPut('c:/Users/1/Desktop/alfa/src/components/Sidebar.tsx', '/www/wwwroot/n'+i+'.namainvist.com/src/components/Sidebar.tsx', e => e?j(e):r())));
                }
                await Promise.all(proms);
                console.log('Upload complete. Triggering PARALLEL Sidebar builds...');
                
                // PARALLEL: the & is back inside the loop
                conn.exec(`cat << 'EOF' > /root/deploy_sidebar_parallel.sh\n${buildCmd}\nEOF\nbash /root/deploy_sidebar_parallel.sh`, (err, stream) => { 
                    if (err) throw err; 
                    stream.on('close', () => {
                        console.log('PARALLEL Sidebar deployment triggered successfully on all 10 nodes SIMULTANEOUSLY.');
                        conn.end();
                    });
                });
            } catch(e) { console.error(e); conn.end(); }
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
