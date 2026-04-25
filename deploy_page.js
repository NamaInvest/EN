const { Client } = require('ssh2');
const fs = require('fs');

const filePage = fs.readFileSync('src/app/page.tsx', 'utf8');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) throw err;
        const stream = sftp.createWriteStream('/www/wwwroot/namainvist.com/src/app/page.tsx');
        stream.write(filePage);
        stream.end();
        stream.on('close', () => {
            console.log('page.tsx uploaded successfully.');
            // Now run build and restart
            c.exec('cd /www/wwwroot/namainvist.com && npm run build && pm2 restart main-site', (err, execStream) => {
                if (err) throw err;
                execStream.on('data', d => process.stdout.write(d));
                execStream.stderr.on('data', d => process.stderr.write(d));
                execStream.on('close', () => {
                    console.log('Build and restart done!');
                    c.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
