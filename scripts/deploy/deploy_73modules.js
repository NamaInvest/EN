const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(
            'src/app/(dashboard)/reports/73-modules/page.tsx',
            '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/reports/73-modules/page.tsx',
            (err) => {
                if (err) { console.error(err); c.end(); return; }
                console.log('✅ Uploaded 73-modules/page.tsx');
                c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11 && echo "DONE"', (e, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => { console.log('✅ Complete!'); c.end(); });
                });
            }
        );
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
