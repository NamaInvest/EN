const { Client } = require('ssh2');
const conn = new Client();
const fs = require('fs');

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localPath = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/settings/page.tsx';
        const cmdsList = [];
        
        // Push the file loop
        const pushFile = (i) => {
            return new Promise((resolve, reject) => {
                const remotePath = \`/www/wwwroot/n\${i}.namainvist.com/src/app/(dashboard)/settings/page.tsx\`;
                sftp.fastPut(localPath, remotePath, (err) => {
                    // Ignore errors if directory doesn't exist
                    resolve();
                });
            });
        };

        const pushAll = async () => {
            for(let i=1; i<=10; i++) {
                try { await pushFile(i); } catch(e){}
            }
            // Now run the update-env and builds
            const buildCmd = `
                echo "Rebuilding and updating environments..."
                for i in {2..10}; do
                    dir="/www/wwwroot/n$i.namainvist.com"
                    if [ -d "$dir" ]; then
                        echo "Processing n$i..."
                        cd $dir
                        pm2 restart n$i --update-env || true
                        pm2 restart n$i-whatsapp --update-env || true
                    fi
                done
                
                # Rebuild n9 visually to test the UI 
                cd /www/wwwroot/n9.namainvist.com
                npm run build
                pm2 restart n9
                echo "Done updating n9!"
            `;
            conn.exec(buildCmd, (err, stream) => {
                let out = '';
                stream.on('data', d => out += d.toString());
                stream.stderr.on('data', d => out += d.toString());
                stream.on('close', () => {
                    console.log(out);
                    conn.end();
                });
            });
        };
        
        pushAll();
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
