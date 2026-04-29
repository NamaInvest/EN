const { Client } = require('ssh2'); 
const conn = new Client(); 

const buildCmd = `#!/bin/bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  (
    echo "Starting hotfix CSS/Lang compilation n$i"
    cd /www/wwwroot/n$i.namainvist.com
    npm run build
    pm2 restart n$i --update-env
    echo "Completed hotfix n$i"
  ) > /root/hotfix_lang_n$i.log 2>&1 &
done
`;

conn.on('ready', () => { 
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        try {
            console.log('Uploading globals.css and LanguageSwitcher.tsx to all 10 servers...');
            let proms = [];
            for(let i=1; i<=10; i++) {
                proms.push(new Promise((r, j) => sftp.fastPut('c:/Users/1/Desktop/alfa/src/components/LanguageSwitcher.tsx', '/www/wwwroot/n'+i+'.namainvist.com/src/components/LanguageSwitcher.tsx', e => e?j(e):r())));
                proms.push(new Promise((r, j) => sftp.fastPut('c:/Users/1/Desktop/alfa/src/app/globals.css', '/www/wwwroot/n'+i+'.namainvist.com/src/app/globals.css', e => e?j(e):r())));
            }
            await Promise.all(proms);
            console.log('Upload complete. Triggering background builds...');
            
            conn.exec(`cat << 'EOF' > /root/hotfix_lang.sh\n${buildCmd}\nEOF\nbash /root/hotfix_lang.sh`, (err, stream) => { 
                if (err) throw err; 
                stream.on('close', () => {
                    console.log('Builds triggered successfully on all nodes.');
                    conn.end();
                });
            });
        } catch(e) { console.error(e); conn.end(); }
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
