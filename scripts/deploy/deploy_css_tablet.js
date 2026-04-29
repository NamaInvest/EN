const { Client } = require('ssh2'); 
const conn = new Client(); 

const buildCmd = `#!/bin/bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  (
    echo "Starting CSS Hotfix n$i"
    cd /www/wwwroot/n$i.namainvist.com
    npm run build
    pm2 restart n$i --update-env
    echo "Completed CSS Hotfix n$i"
  ) > /root/deploy_css_tablet_n$i.log 2>&1 &
done
`;

conn.on('ready', () => { 
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        try {
            console.log('Uploading updated globals.css to all 10 servers...');
            let proms = [];
            for(let i=1; i<=10; i++) {
                proms.push(new Promise((r, j) => sftp.fastPut('c:/Users/1/Desktop/alfa/src/app/globals.css', '/www/wwwroot/n'+i+'.namainvist.com/src/app/globals.css', e => e?j(e):r())));
            }
            await Promise.all(proms);
            console.log('Upload complete. Triggering background CSS builds...');
            
            conn.exec(`cat << 'EOF' > /root/deploy_css_tablet.sh\n${buildCmd}\nEOF\nbash /root/deploy_css_tablet.sh`, (err, stream) => { 
                if (err) throw err; 
                stream.on('close', () => {
                    console.log('CSS tablet deployment triggered successfully on all nodes.');
                    conn.end();
                });
            });
        } catch(e) { console.error(e); conn.end(); }
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
