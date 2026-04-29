const { Client } = require('ssh2');
const fs = require('fs');

const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 120000 };
const localFile = 'c:\\Users\\1\\Desktop\\alfa\\src\\middleware.ts';

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected. Uploading fixed middleware.ts to N1-N11...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let nodes = Array.from({length: 11}, (_, i) => i + 1); // 1 to 11
        let uploaded = 0;

        nodes.forEach(i => {
            const remoteFile = `/www/wwwroot/n${i}.namainvist.com/src/middleware.ts`;
            sftp.fastPut(localFile, remoteFile, (err) => {
                if (err) {
                    console.error(`Skipping N${i}: maybe directory doesn't exist`);
                } else {
                    console.log(`Uploaded middleware.ts to N${i} successfully!`);
                }
                uploaded++;
                if (uploaded === nodes.length) {
                    console.log('Starting PM2 restarts...');
                    conn.exec(`nohup sh -c '
for i in {1..11}; do
    echo "Restarting N$i and checking build..."
    cd /www/wwwroot/n$i.namainvist.com && npm run build
    pm2 restart n$i || pm2 start npm --name "n$i" -- start -- -p "30$(printf "%02d" $i)"
done
' > /www/wwwroot/fix_redirect_all.log 2>&1 &`, (err) => {
                        if (err) throw err;
                        console.log('Builds and restarts triggered globally. Done.');
                        conn.end();
                    });
                }
            });
        });
    });
}).on('error', console.error).connect(config);
