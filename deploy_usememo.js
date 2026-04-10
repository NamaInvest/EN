const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(
            'src/app/(dashboard)/settings/page.tsx',
            '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/settings/page.tsx',
            (err) => {
                if (err) { console.error('Upload failed:', err); c.end(); return; }
                console.log('✅ Uploaded settings/page.tsx');
                
                c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11 && echo "BUILD DONE"', (err3, stream) => {
                    if (err3) { console.error(err3); c.end(); return; }
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\n✅ Build and restart complete!');
                        c.end();
                    });
                });
            }
        );
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
