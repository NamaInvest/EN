const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';

const files = [
    'prisma/schema.prisma',
    'src/lib/governance-engine.ts',
    'src/lib/approval-engine.ts',
    'src/lib/inventory-engine.ts',
    'src/lib/open-items.ts',
    'src/lib/recurring-journal-runner.ts',
    'src/app/api/manufacturing/quality-control/route.ts'
];

conn.on('ready', () => {
    console.log('Connected to Fleet Server.');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        let done = 0;
        files.forEach(f => {
            const localPath = path.join(process.cwd(), f);
            const remotePath = `${APP}/${f.replace(/\\/g, '/')}`;
            
            sftp.fastPut(localPath, remotePath, (err) => {
                if (err) console.log('Upload error for ' + f + ':', err);
                else console.log('Uploaded: ' + f);
                
                done++;
                if (done === files.length) {
                    console.log('Building...');
                    conn.exec('cd ' + APP + ' && npx prisma generate && npm run build && pm2 restart main-site && echo DONE', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => conn.end());
                    });
                }
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
