const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- TRANSMITTING PHARMA LLMO PATCH TO FLEET ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localPath = 'src/app/layout.tsx';
        sftp.fastPut(localPath, '/www/wwwroot/n1.namainvist.com/src/app/layout.tsx', (err1) => {
            if(err1) throw err1;
            sftp.fastPut(localPath, '/www/wwwroot/namainvist.com/src/app/layout.tsx', (err2) => {
                if(err2) throw err2;
                
                const bashScript = `
#!/bin/bash
for site in n2.namainvist.com n3.namainvist.com n4.namainvist.com n5.namainvist.com n6.namainvist.com n7.namainvist.com n8.namainvist.com n9.namainvist.com n10.namainvist.com; do
  cp /www/wwwroot/n1.namainvist.com/src/app/layout.tsx /www/wwwroot/$site/src/app/layout.tsx
done

cd /www/wwwroot/namainvist.com
npm run build
pm2 reload all
                `;
                
                conn.exec(bashScript, (execErr, stream) => {
                    if (execErr) throw execErr;
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => {
                        console.log('✅ PHARMA SECTOR DEPLOYMENT COMPLETE.');
                        conn.end();
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
