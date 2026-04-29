const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- TRANSMITTING MASTER PANEL TO N1 ---');
    
    // First, delete the old conflicting path on N1
    conn.exec('rm -rf /www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/master-panel && mkdir -p /www/wwwroot/n1.namainvist.com/src/app/master-panel', (err, stream) => {
        if (err) throw err;
        
        console.log("✅ Cleared deprecated routing structure.");
        
        conn.sftp((err, sftp) => {
            if (err) throw err;
            
            const layoutLocal = 'src/app/master-panel/layout.tsx';
            const pageLocal   = 'src/app/master-panel/page.tsx';
            
            const layoutRemote = '/www/wwwroot/n1.namainvist.com/src/app/master-panel/layout.tsx';
            const pageRemote   = '/www/wwwroot/n1.namainvist.com/src/app/master-panel/page.tsx';
            
            sftp.fastPut(layoutLocal, layoutRemote, (err1) => {
                if (err1) throw err1;
                sftp.fastPut(pageLocal, pageRemote, (err2) => {
                    if (err2) throw err2;
                    console.log("✅ Injected Standalone Master Panel Codebase!");
                    
                    console.log("🚀 Rebuilding Next.js Core...");
                    const cmd = `
                        cd /www/wwwroot/n1.namainvist.com
                        npm run build
                        pm2 restart n1 --update-env
                    `;
                    
                    conn.exec(cmd, (execErr, logStream) => {
                        if (execErr) throw execErr;
                        logStream.on('data', d => process.stdout.write(d.toString()));
                        logStream.stderr.on('data', d => process.stderr.write(d.toString()));
                        logStream.on('close', () => {
                            console.log('✅ MASTER PANEL DEPLOYMENT COMPLETE.');
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
