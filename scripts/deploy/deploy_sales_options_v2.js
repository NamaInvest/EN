const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 60000
};

const localFile = 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\sales\\options\\page.tsx';
const remoteN1File = '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/sales/options/page.tsx';
const remoteN11File = '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/sales/options/page.tsx';

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastPut(localFile, remoteN11File, (err) => {
            if (err) throw err;
            console.log('Successfully uploaded to N11');
            
            sftp.fastPut(localFile, remoteN1File, (err) => {
                if (err) throw err;
                console.log('Successfully uploaded to N1');
                
                // Now trigger builds
                conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                    if (err) throw err;
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => {
                        console.log('N11 built and restarted.');
                        
                        // Also build N1
                        conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1', (err, stream) => {
                            if (err) throw err;
                            stream.on('data', d => process.stdout.write(d.toString()));
                            stream.stderr.on('data', d => process.stderr.write(d.toString()));
                            stream.on('close', () => {
                                console.log('N1 build complete.');
                                conn.end();
                            });
                        });
                    });
                });
            });
        });
    });
}).on('error', console.error).connect(config);
