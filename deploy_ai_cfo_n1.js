const { Client } = require('ssh2');

const fileTasks = [
    { local: 'd:/namasoft9-3-main/src/components/Sidebar.tsx', remote: '/www/wwwroot/n1.namainvist.com/src/components/Sidebar.tsx' },
    { local: 'd:/namasoft9-3-main/src/app/(dashboard)/ai-cfo/page.tsx', remote: '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/ai-cfo/page.tsx' },
    { local: 'd:/namasoft9-3-main/src/app/api/ai-cfo/report/route.ts', remote: '/www/wwwroot/n1.namainvist.com/src/app/api/ai-cfo/report/route.ts' }
];

const conn = new Client();
conn.on('ready', () => {
    console.log('[N1] SSH Ready. Creating AI CFO Directories...');
    conn.exec('mkdir -p /www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/ai-cfo && mkdir -p /www/wwwroot/n1.namainvist.com/src/app/api/ai-cfo/report', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('[N1] Directors created. Starting SFTP upload...');
            conn.sftp((err, sftp) => {
                if (err) throw err;

                let uploaded = 0;
                for (const task of fileTasks) {
                    sftp.fastPut(task.local, task.remote, (err) => {
                        if (err) throw err;
                        console.log(`Uploaded: ${task.local.split('/').pop()}`);
                        uploaded++;
                        
                        if (uploaded === fileTasks.length) {
                            console.log('[N1] All AI CFO files uploaded! Rebuilding Phase 9 Modules...');
                            
                            const buildCmd = 'cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1';
                            conn.exec(buildCmd, (err, buildStream) => {
                                if (err) throw err;
                                buildStream.on('data', d => process.stdout.write(d.toString()));
                                buildStream.stderr.on('data', d => process.stderr.write(d.toString()));
                                buildStream.on('close', () => {
                                    console.log('[N1] AI CFO Build & Restart Completed Successfully!');
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
