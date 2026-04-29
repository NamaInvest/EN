const { Client } = require('ssh2'); 
const conn = new Client(); 

conn.on('ready', () => { 
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        try {
            console.log('Uploading PWA fixes to all 10 servers...');
            let proms = [];
            for(let i=1; i<=10; i++) {
                const targetPath = '/www/wwwroot/n'+i+'.namainvist.com/public/';
                proms.push(new Promise((r, j) => sftp.fastPut('c:/Users/1/Desktop/alfa/public/sw.js', targetPath + 'sw.js', e => e?j(e):r())));
                proms.push(new Promise((r, j) => sftp.fastPut('c:/Users/1/Desktop/alfa/public/manifest.webmanifest', targetPath + 'manifest.webmanifest', e => e?j(e):r())));
                // Force PM2 restart to ensure static files are served if cached by Nginx proxy
            }
            await Promise.all(proms);
            console.log('Upload complete for PWA files.');
            
            // We just restart Next servers quickly so they pick up public/ folder changes
            conn.exec(`for i in {1..10}; do pm2 restart n$i; done`, (err, stream) => {
                stream.on('close', () => {
                    console.log('Restarted PM2 to serve new static PWA files.');
                    conn.end();
                });
            });
        } catch(e) { console.error(e); conn.end(); }
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
