const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const hostIp = '46.4.188.170';
const domain = 'n1.namainvist.com';
const basePath = '/www/wwwroot/' + domain;

console.log('Connecting to VPS to deploy Restaurant POS to n1...');

conn.on('ready', () => {
    console.log('Connected. Creating Restaurant POS directories...');
    
    conn.exec(`mkdir -p ${basePath}/src/app/restaurant-pos`, (err, stream) => {
        if (err) { console.error("Exec error:", err); return conn.end(); }
        stream.resume(); // CRITICAL: Drain the stream so 'close' fires
        
        stream.on('close', () => {
            console.log('Directories created. Uploading files...');
            conn.sftp((err, sftp) => {
                if (err) { console.error("SFTP error:", err); return conn.end(); }
                
                try {
                    const files = [
                        { local: 'c:/Users/1/Desktop/alfa/src/app/restaurant-pos/page.tsx', remote: `${basePath}/src/app/restaurant-pos/page.tsx` },
                        { local: 'c:/Users/1/Desktop/alfa/src/components/Sidebar.tsx', remote: `${basePath}/src/components/Sidebar.tsx` }
                    ];
                    
                    let uploads = 0;
                    files.forEach(f => {
                        console.log("Reading:", f.local);
                        const localData = fs.readFileSync(f.local, 'utf8');
                        sftp.writeFile(f.remote, localData, (err) => {
                            if (err) { console.error("Write error:", err); return conn.end(); }
                            uploads++;
                            console.log(`Uploaded ${uploads}/${files.length}`);
                            
                            if (uploads === files.length) {
                                console.log('Files uploaded. Triggering Next.js Build on n1 (This takes ~1 minute)...');
                                
                                conn.exec(`cd ${basePath} && npm run build && pm2 reload n1`, (err, buildStream) => {
                                    if (err) { console.error("Build exec error:", err); return conn.end(); }
                                    buildStream.on('data', d => process.stdout.write(d));
                                    buildStream.stderr.on('data', d => process.stderr.write(d));
                                    buildStream.on('close', (code) => {
                                        console.log('Build & Reload Finished with code ' + code);
                                        conn.end();
                                    });
                                });
                            }
                        });
                    });
                } catch(e) {
                    console.error("TryCatch error:", e);
                    conn.end();
                }
            });
        });
    });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect({
    host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000
});
