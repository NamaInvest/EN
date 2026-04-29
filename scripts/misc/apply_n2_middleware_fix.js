const { Client } = require('ssh2');

const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 120000 };
const localFile = 'c:\\Users\\1\\Desktop\\alfa\\src\\middleware.ts';

console.log('Connecting to N2...');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const remoteFile = `/www/wwwroot/n2.namainvist.com/src/middleware.ts`;
        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) {
                console.error(`Failed uploading to N2`, err);
                conn.end();
            } else {
                console.log(`Uploaded fixed middleware.ts to N2! Building now...`);
                conn.exec(`nohup sh -c '
cd /www/wwwroot/n2.namainvist.com
echo "Building N2..."
npm run build
pm2 restart n2 || pm2 start npm --name "n2" -- start -- -p 3002
' > /www/wwwroot/n2_redirect_fix.log 2>&1 &`, (err) => {
                    if (err) throw err;
                    console.log('Triggered build and restart on N2. Fixed!');
                    conn.end();
                });
            }
        });
    });
}).connect(config);
