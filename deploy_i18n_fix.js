const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) throw err;
        console.log('Uploading i18n.tsx...');
        sftp.fastPut('src/lib/i18n.tsx', '/www/wwwroot/n11.namainvist.com/src/lib/i18n.tsx', (err) => {
            if (err) { console.error('Upload failed:', err); c.end(); return; }
            console.log('✅ Uploaded i18n.tsx');
            
            // Also upload ar.json to make sure it's there
            sftp.fastPut('src/locales/ar.json', '/www/wwwroot/n11.namainvist.com/src/locales/ar.json', (err2) => {
                if (err2) console.warn('ar.json upload warning:', err2?.message);
                else console.log('✅ Uploaded ar.json');
                
                // Rebuild
                c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11 && echo "BUILD AND RESTART DONE"', (err3, stream) => {
                    if (err3) { console.error(err3); c.end(); return; }
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => {
                        console.log('Done!');
                        c.end();
                    });
                });
            });
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
