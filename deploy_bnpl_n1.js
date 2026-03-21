const { Client } = require('ssh2');

const fileTasks = [
    { local: 'd:/namasoft9-3-main/src/app/(dashboard)/settings/page.tsx', remote: '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/settings/page.tsx' },
    { local: 'd:/namasoft9-3-main/src/app/pos/page.tsx', remote: '/www/wwwroot/n1.namainvist.com/src/app/pos/page.tsx' },
    { local: 'd:/namasoft9-3-main/src/app/api/pos/checkout/route.ts', remote: '/www/wwwroot/n1.namainvist.com/src/app/api/pos/checkout/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/bnpl/tabby/route.ts', remote: '/www/wwwroot/n1.namainvist.com/src/app/api/bnpl/tabby/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/bnpl/tamara/route.ts', remote: '/www/wwwroot/n1.namainvist.com/src/app/api/bnpl/tamara/route.ts' }
];

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH connection established. Creating BNPL directories...');
    conn.exec('mkdir -p /www/wwwroot/n1.namainvist.com/src/app/api/bnpl/tabby && mkdir -p /www/wwwroot/n1.namainvist.com/src/app/api/bnpl/tamara', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Directories ready. Starting SFTP upload...');
            conn.sftp((err, sftp) => {
                if (err) throw err;

                let uploaded = 0;
                for (const task of fileTasks) {
                    sftp.fastPut(task.local, task.remote, (err) => {
                        if (err) throw err;
                        console.log(`Uploaded: ${task.local.split('/').pop()}`);
                        uploaded++;
                        
                        if (uploaded === fileTasks.length) {
                            console.log('All files uploaded successfully. Triggering Next.js Production Build...');
                            
                            const buildCmd = 'cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1';
                            conn.exec(buildCmd, (err, buildStream) => {
                                if (err) throw err;
                                buildStream.on('data', d => process.stdout.write(d.toString()));
                                buildStream.stderr.on('data', d => process.stderr.write(d.toString()));
                                buildStream.on('close', () => {
                                    console.log('Build and Restart Completed!');
                                    conn.end();
                                });
                            });
                        }
                    });
                }
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
