const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 60000
};

const localFile = 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\reports\\73-modules\\page.tsx';
const remoteN1File = '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/reports/73-modules/page.tsx';
const remoteN11File = '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/reports/73-modules/page.tsx';

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastPut(localFile, remoteN11File, (err) => {
            if (err) throw err;
            console.log('Successfully uploaded 73-modules to N11');
            
            sftp.fastPut(localFile, remoteN1File, (err) => {
                if (err) throw err;
                console.log('Successfully uploaded 73-modules to N1');
                
                // Trigger builds in background, redirecting output so the process can exit
                conn.exec('nohup sh -c "cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11" > /www/wwwroot/n11_build.log 2>&1 &', (err, stream) => {
                    if (err) throw err;
                    
                    conn.exec('nohup sh -c "cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart nama-main" > /www/wwwroot/n1_build.log 2>&1 &', (err, stream2) => {
                        if (err) throw err;
                        console.log('Background builds initiated for N1 and N11.');
                        setTimeout(() => conn.end(), 1000);
                    });
                });
            });
        });
    });
}).on('error', console.error).connect(config);
